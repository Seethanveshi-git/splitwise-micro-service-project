package com.splitwise.group.controller;

import com.splitwise.group.dto.AddMemberRequest;
import com.splitwise.group.dto.GroupRequest;
import com.splitwise.group.dto.GroupResponse;
import com.splitwise.group.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(@Valid @RequestBody GroupRequest request) {
        return ResponseEntity.ok(groupService.createGroup(request));
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<String> addMember(@PathVariable Long groupId, @Valid @RequestBody AddMemberRequest request) {
        groupService.addMember(groupId, request);
        return ResponseEntity.ok("Member added successfully");
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getUserGroups() {
        return ResponseEntity.ok(groupService.getUserGroups());
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> getGroupDetails(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroupDetails(groupId));
    }
}
