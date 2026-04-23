package com.splitwise.dashboard.controller;

import com.splitwise.dashboard.dto.GroupDashboardResponse;
import com.splitwise.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/group/{groupId}")
    public ResponseEntity<GroupDashboardResponse> getGroupDashboard(
            @PathVariable Long groupId,
            @RequestHeader("Authorization") String token) {
        
        return ResponseEntity.ok(dashboardService.getGroupDashboard(groupId, token));
    }

    @GetMapping("/summary")
    public ResponseEntity<GroupDashboardResponse> getUserSummary(
            @RequestHeader("Authorization") String token) {
        
        return ResponseEntity.ok(dashboardService.getUserSummary(token));
    }
}
