package com.splitwise.group.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class GroupRequest {
    @NotBlank(message = "Group name is required")
    private String name;
    
    private List<MemberRequest> members;
}
