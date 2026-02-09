package com.denial.bot.model;

import lombok.*;

/**
 * Login response DTO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	private String token;
    private String username;
    private String message;
    private boolean success;

    @Override
    public String toString() {
        return "LoginResponse{" +
                "token='" + (token == null ? null : "[PROTECTED]") + '\'' +
                ", username='" + username + '\'' +
                ", message='" + message + '\'' +
                ", success=" + success +
                '}';
    }
}
