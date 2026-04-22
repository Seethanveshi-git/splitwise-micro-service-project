package com.splitwise.auth.controller;

import com.splitwise.auth.dto.AuthResponse;
import com.splitwise.auth.dto.LoginRequest;
import com.splitwise.auth.dto.SignupRequest;
import com.splitwise.auth.dto.UserDTO;
import com.splitwise.auth.dto.ValidateTokenResponse;
import com.splitwise.auth.entity.User;
import com.splitwise.auth.repository.UserRepository;
import com.splitwise.auth.security.JwtUtil;
import com.splitwise.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, JwtUtil jwtUtil, UserRepository userRepository) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserDTO> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/validate")
    public ResponseEntity<ValidateTokenResponse> validateToken(@RequestHeader("Authorization") String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        boolean isValid = jwtUtil.validateToken(token);
        if (isValid) {
            String email = jwtUtil.extractUsername(token);
            Long userId = jwtUtil.extractUserId(token);
            return ResponseEntity.ok(new ValidateTokenResponse(userId, email, true));
        } else {
            return ResponseEntity.ok(new ValidateTokenResponse(null, null, false));
        }
    }
}
