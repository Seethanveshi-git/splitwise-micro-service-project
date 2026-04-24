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

import java.util.List;

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
        UserDTO user = authService.signup(request);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, jakarta.servlet.http.HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        
        // Create Cookie
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("jwt", authResponse.getToken())
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(24 * 60 * 60) // 1 day
                .sameSite("Lax")
                .build();
        
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
        
        return ResponseEntity.ok(authResponse);
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

    @GetMapping("/user")
    public ResponseEntity<UserDTO> getOrCreateUser(
            @RequestParam String email, 
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(authService.getOrCreateUser(email, name != null ? name : email));
    }

    @GetMapping("/users/list")
    public ResponseEntity<List<UserDTO>> getUsersByIds(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(authService.getUsersByIds(ids));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(jakarta.servlet.http.HttpServletResponse response) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0) // Expire immediately
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }
}
