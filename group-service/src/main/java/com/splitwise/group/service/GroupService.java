package com.splitwise.group.service;

import com.splitwise.group.config.UserContext;
import com.splitwise.group.dto.AddMemberRequest;
import com.splitwise.group.dto.GroupRequest;
import com.splitwise.group.dto.GroupResponse;
import com.splitwise.group.entity.Group;
import com.splitwise.group.entity.GroupMember;
import com.splitwise.group.repository.GroupMemberRepository;
import com.splitwise.group.repository.GroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import com.splitwise.group.client.AuthServiceClient;
import com.splitwise.group.dto.UserDTO;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final AuthServiceClient authServiceClient;

    public GroupService(GroupRepository groupRepository, GroupMemberRepository groupMemberRepository, AuthServiceClient authServiceClient) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.authServiceClient = authServiceClient;
    }

    @Transactional
    public GroupResponse createGroup(GroupRequest request) {
        Long currentUserId = UserContext.getUserId();

        Group group = Group.builder()
                .name(request.getName())
                .createdBy(currentUserId)
                .createdAt(LocalDateTime.now())
                .build();

        group = groupRepository.save(group);

        // Add creator as a member
        GroupMember creatorMember = GroupMember.builder()
                .group(group)
                .userId(currentUserId)
                .joinedAt(LocalDateTime.now())
                .build();
        groupMemberRepository.save(creatorMember);

        // Add other members by calling Auth Service via Feign
        if (request.getMembers() != null) {
            for (var memberReq : request.getMembers()) {
                if (memberReq.getEmail() != null && !memberReq.getEmail().isBlank()) {
                    try {
                        // Use Feign Client instead of RestTemplate
                        UserDTO userDTO = authServiceClient.getOrCreateUser(
                                memberReq.getEmail().trim(), 
                                memberReq.getName().trim()
                        );
                        
                        if (userDTO != null && !userDTO.getId().equals(currentUserId)) {
                            GroupMember otherMember = GroupMember.builder()
                                    .group(group)
                                    .userId(userDTO.getId())
                                    .joinedAt(LocalDateTime.now())
                                    .build();
                            groupMemberRepository.save(otherMember);
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to resolve user " + memberReq.getEmail() + ": " + e.getMessage());
                    }
                }
            }
        }

        return mapToResponse(group);
    }

    @Transactional
    public void addMember(Long groupId, AddMemberRequest request) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Check if already a member
        if (groupMemberRepository.findByGroupIdAndUserId(groupId, request.getUserId()).isPresent()) {
            throw new RuntimeException("User is already a member of this group");
        }

        GroupMember member = GroupMember.builder()
                .group(group)
                .userId(request.getUserId())
                .joinedAt(LocalDateTime.now())
                .build();
        groupMemberRepository.save(member);
    }

    public List<GroupResponse> getUserGroups() {
        Long currentUserId = UserContext.getUserId();
        List<GroupMember> memberships = groupMemberRepository.findByUserId(currentUserId);

        return memberships.stream()
                .map(GroupMember::getGroup)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GroupResponse getGroupDetails(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return mapToResponse(group);
    }

    private GroupResponse mapToResponse(Group group) {
        List<Long> memberIds = groupMemberRepository.findByGroupId(group.getId())
                .stream()
                .map(GroupMember::getUserId)
                .collect(Collectors.toList());

        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .createdBy(group.getCreatedBy())
                .createdAt(group.getCreatedAt())
                .members(memberIds)
                .build();
    }

    @Transactional
    public void deleteGroup(Long groupId) {
        Long currentUserId = UserContext.getUserId();
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getCreatedBy().equals(currentUserId)) {
            throw new RuntimeException("Only the group creator can delete this group");
        }

        groupRepository.delete(group);
    }

    @Transactional
    public GroupResponse updateGroup(Long groupId, GroupRequest request) {
        Long currentUserId = UserContext.getUserId();
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getCreatedBy().equals(currentUserId)) {
            throw new RuntimeException("Only the group creator can edit this group");
        }

        group.setName(request.getName());
        
        // Update members
        if (request.getMembers() != null) {
            // Clear existing members (orphanRemoval will handle database deletion)
            group.getMembers().clear();
            
            // Re-add creator
            GroupMember creator = GroupMember.builder()
                    .group(group)
                    .userId(currentUserId)
                    .joinedAt(LocalDateTime.now())
                    .build();
            group.getMembers().add(creator);

            // Add other members
            for (var memberReq : request.getMembers()) {
                if (memberReq.getEmail() != null && !memberReq.getEmail().isBlank()) {
                    try {
                        UserDTO userDTO = authServiceClient.getOrCreateUser(
                                memberReq.getEmail().trim(), 
                                memberReq.getName().trim()
                        );
                        
                        if (userDTO != null && !userDTO.getId().equals(currentUserId)) {
                            GroupMember otherMember = GroupMember.builder()
                                    .group(group)
                                    .userId(userDTO.getId())
                                    .joinedAt(LocalDateTime.now())
                                    .build();
                            group.getMembers().add(otherMember);
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to resolve user " + memberReq.getEmail() + ": " + e.getMessage());
                    }
                }
            }
        }

        group = groupRepository.save(group);
        return mapToResponse(group);
    }
}
