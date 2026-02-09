package com.denial.bot.controller;

import com.denial.bot.entity.ChatMessage;
import com.denial.bot.entity.ChatSession;
import com.denial.bot.entity.User;
import com.denial.bot.repository.ChatMessageRepository;
import com.denial.bot.repository.ChatSessionRepository;
import com.denial.bot.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatHistoryController {

    private static final Logger logger = LoggerFactory.getLogger(ChatHistoryController.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Optional<User> getUserFromAuthHeader(String authHeader) {
        if (authHeader == null) return Optional.empty();
        String token = authHeader.replace("Bearer ", "");
        if (!authService.validateToken(token)) return Optional.empty();
        String username = authService.getUsernameFromToken(token);
        return authService.getUserByUsername(username);
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> listSessions(@RequestHeader("Authorization") String token) {
        try {
            Optional<User> userOpt = getUserFromAuthHeader(token);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized access"));
            }

            List<ChatSession> sessions = chatSessionRepository.findByUserOrderBySessionDateDesc(userOpt.get());
            List<Map<String, Object>> data = new ArrayList<>();
            for (ChatSession s : sessions) {
                data.add(Map.of(
                        "id", s.getId(),
                        "sessionDate", s.getSessionDate(),
                        "title", s.getTitle(),
                        "updatedAt", s.getUpdatedAt()
                ));
            }

            return ResponseEntity.ok(Map.of("success", true, "count", data.size(), "data", data));
        } catch (Exception e) {
            logger.error("Failed to list chat sessions", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Failed to list sessions: " + e.getMessage()));
        }
    }

    @GetMapping("/sessions/today")
    public ResponseEntity<?> getOrCreateToday(@RequestHeader("Authorization") String token) {
        try {
            Optional<User> userOpt = getUserFromAuthHeader(token);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized access"));
            }

            User user = userOpt.get();
            LocalDate today = LocalDate.now();
            ChatSession session = chatSessionRepository.findByUserAndSessionDate(user, today)
                    .orElseGet(() -> chatSessionRepository.save(ChatSession.builder()
                            .user(user)
                            .sessionDate(today)
                            .title("Chat - " + today)
                            .build()));

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "id", session.getId(),
                            "sessionDate", session.getSessionDate(),
                            "title", session.getTitle(),
                            "updatedAt", session.getUpdatedAt()
                    )
            ));
        } catch (Exception e) {
            logger.error("Failed to get/create today's chat session", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Failed to get/create session: " + e.getMessage()));
        }
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<?> getMessages(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String token) {
        try {
            Optional<User> userOpt = getUserFromAuthHeader(token);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized access"));
            }

            Optional<ChatSession> sessionOpt = chatSessionRepository.findById(sessionId);
            if (sessionOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Session not found"));
            }

            ChatSession session = sessionOpt.get();
            if (!session.getUser().getId().equals(userOpt.get().getId())) {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Forbidden"));
            }

            List<ChatMessage> messages = chatMessageRepository.findBySessionOrderByCreatedAtAsc(session);
            List<Map<String, Object>> data = new ArrayList<>();
            for (ChatMessage m : messages) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", m.getId());
                item.put("role", m.getRole());
                item.put("content", m.getContent());
                item.put("contentType", m.getContentType());
                item.put("metadata", m.getMetadata());
                item.put("createdAt", m.getCreatedAt());
                data.add(item);
            }

            return ResponseEntity.ok(Map.of("success", true, "count", data.size(), "data", data));
        } catch (Exception e) {
            logger.error("Failed to fetch chat messages", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Failed to fetch messages: " + e.getMessage()));
        }
    }

    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<?> appendMessage(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> request) {
        try {
            Optional<User> userOpt = getUserFromAuthHeader(token);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized access"));
            }

            Optional<ChatSession> sessionOpt = chatSessionRepository.findById(sessionId);
            if (sessionOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Session not found"));
            }

            ChatSession session = sessionOpt.get();
            if (!session.getUser().getId().equals(userOpt.get().getId())) {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Forbidden"));
            }

            String role = Objects.toString(request.get("role"), "").trim();
            String content = Objects.toString(request.get("content"), "");
            String contentType = Objects.toString(request.get("contentType"), "text").trim();
            Object metadataObj = request.get("metadata");

            if (role.isEmpty() || content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "role and content are required"));
            }

            String metadata = null;
            if (metadataObj != null) {
                metadata = metadataObj instanceof String
                        ? (String) metadataObj
                        : objectMapper.writeValueAsString(metadataObj);
            }

            ChatMessage msg = ChatMessage.builder()
                    .session(session)
                    .role(role)
                    .content(content)
                    .contentType(contentType.isEmpty() ? "text" : contentType)
                    .metadata(metadata)
                    .build();

            ChatMessage saved = chatMessageRepository.save(msg);
            session.setUpdatedAt(LocalDateTime.now());
            chatSessionRepository.save(session);

            return ResponseEntity.ok(Map.of("success", true, "data", Map.of(
                    "id", saved.getId(),
                    "createdAt", saved.getCreatedAt()
            )));
        } catch (Exception e) {
            logger.error("Failed to append chat message", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Failed to append message: " + e.getMessage()));
        }
    }
}
