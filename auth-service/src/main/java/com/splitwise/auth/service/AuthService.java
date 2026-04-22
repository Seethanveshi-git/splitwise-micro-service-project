package com.splitwise.auth.service;

import com.splitwise.auth.dto.AuthResponse;
import com.splitwise.auth.dto.LoginRequest;
import com.splitwise.auth.dto.SignupRequest;
import com.splitwise.auth.dto.UserDTO;
import com.splitwise.auth.entity.User;
import com.splitwise.auth.repository.UserRepository;
import com.splitwise.auth.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public UserDTO signup(SignupRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (user.isRegistered()) {
                        throw new RuntimeException("Email is already in use");
                    }
                    // Claim the placeholder account
                    user.setName(request.getName());
                    user.setPassword(passwordEncoder.encode(request.getPassword()));
                    user.setRegistered(true);
                    User savedUser = userRepository.save(user);
                    return mapToDTO(savedUser);
                })
                .orElseGet(() -> {
                    User user = User.builder()
                            .name(request.getName())
                            .email(request.getEmail())
                            .password(passwordEncoder.encode(request.getPassword()))
                            .isRegistered(true)
                            .build();
                    User savedUser = userRepository.save(user);
                    return mapToDTO(savedUser);
                });
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        if (authentication.isAuthenticated()) {
            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
            String token = jwtUtil.generateToken(user.getEmail(), user.getId());
            return new AuthResponse(token, user.getId(), user.getEmail(), user.getName());
        } else {
            throw new RuntimeException("Invalid credentials");
        }
    }

    public UserDTO getOrCreateUser(String email, String name) {
        return userRepository.findByEmail(email)
                .map(user -> UserDTO.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .build())
                .orElseGet(() -> {
                    // Create a placeholder user for invitations
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .password(java.util.UUID.randomUUID().toString())
                            .isRegistered(false)
                            .build();
                    newUser = userRepository.save(newUser);
                    return UserDTO.builder()
                            .id(newUser.getId())
                            .name(newUser.getName())
                            .email(newUser.getEmail())
                            .build();
                });
    }

    public List<UserDTO> getUsersByIds(List<Long> ids) {
        return userRepository.findAllById(ids).stream()
                .map(this::mapToDTO)
                .collect(java.util.stream.Collectors.toList());
    }
}
