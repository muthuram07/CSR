package com.denial.bot.repository;

import com.denial.bot.entity.ChatSession;
import com.denial.bot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findByUserAndSessionDate(User user, LocalDate sessionDate);
    List<ChatSession> findByUserOrderBySessionDateDesc(User user);
}
