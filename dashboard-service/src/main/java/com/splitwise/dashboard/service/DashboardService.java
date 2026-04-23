package com.splitwise.dashboard.service;

import com.splitwise.dashboard.client.AuthServiceClient;
import com.splitwise.dashboard.client.ExpenseServiceClient;
import com.splitwise.dashboard.client.GroupServiceClient;
import com.splitwise.dashboard.dto.GroupDashboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final GroupServiceClient groupServiceClient;
    private final AuthServiceClient authServiceClient;
    private final ExpenseServiceClient expenseServiceClient;

    private Long toLong(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).longValue();
        return Long.valueOf(obj.toString());
    }

    public GroupDashboardResponse getUserSummary(String token) {
        try {
            List<Object> groups = groupServiceClient.getUserGroups(token);
            List<Object> allExpenses = new ArrayList<>();
            Map<Long, String> nicknameMap = new HashMap<>();

            for (Object groupObj : groups) {
                Map<String, Object> g = (Map<String, Object>) groupObj;
                Long gid = toLong(g.get("id"));
                
                try {
                    List<Object> expenses = expenseServiceClient.getGroupExpenses(gid, token);
                    allExpenses.addAll(expenses);
                } catch (Exception e) {}

                List<?> membersRaw = (List<?>) g.get("members");
                if (membersRaw != null) {
                    for (Object m : membersRaw) {
                        Map<String, Object> memberMap = (Map<String, Object>) m;
                        Long uid = toLong(memberMap.get("userId"));
                        String nick = (String) memberMap.get("nickname");
                        if (nick != null && !nick.isBlank()) {
                            nicknameMap.put(uid, nick);
                        }
                    }
                }
            }

            List<Object> memberDetails = new ArrayList<>();
            if (!nicknameMap.isEmpty()) {
                List<Object> officialDetails = authServiceClient.getUsersByIds(new ArrayList<>(nicknameMap.keySet()));
                memberDetails = officialDetails.stream().map(obj -> {
                    Map<String, Object> m = new HashMap<>((Map<String, Object>) obj);
                    Long uid = toLong(m.get("id"));
                    if (nicknameMap.containsKey(uid)) {
                        m.put("name", nicknameMap.get(uid)); // Override with nickname
                    }
                    return m;
                }).collect(Collectors.toList());
            }

            return GroupDashboardResponse.builder()
                    .group(null)
                    .members(memberDetails)
                    .expenses(allExpenses)
                    .balances(new ArrayList<>())
                    .build();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Summary failed: " + e.getMessage());
        }
    }

    public GroupDashboardResponse getGroupDashboard(Long groupId, String token) {
        try {
            Object group = groupServiceClient.getGroupDetails(groupId, token);
            Map<String, Object> groupMap = (Map<String, Object>) group;
            
            List<?> membersRaw = (List<?>) groupMap.get("members");
            Map<Long, String> nicknameMap = new HashMap<>();
            if (membersRaw != null) {
                for (Object m : membersRaw) {
                    Map<String, Object> memberMap = (Map<String, Object>) m;
                    Long uid = toLong(memberMap.get("userId"));
                    String nick = (String) memberMap.get("nickname");
                    if (nick != null && !nick.isBlank()) {
                        nicknameMap.put(uid, nick);
                    }
                }
            }

            List<Object> officialDetails = authServiceClient.getUsersByIds(new ArrayList<>(nicknameMap.keySet()));
            List<Object> members = officialDetails.stream().map(obj -> {
                Map<String, Object> m = new HashMap<>((Map<String, Object>) obj);
                Long uid = toLong(m.get("id"));
                if (nicknameMap.containsKey(uid)) {
                    m.put("name", nicknameMap.get(uid)); // Override with nickname
                }
                return m;
            }).collect(Collectors.toList());

            List<Object> expenses = expenseServiceClient.getGroupExpenses(groupId, token);
            List<Object> balances = expenseServiceClient.getGroupBalances(groupId, token);

            return GroupDashboardResponse.builder()
                    .group(group)
                    .members(members)
                    .expenses(expenses)
                    .balances(balances)
                    .build();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Group dashboard failed: " + e.getMessage());
        }
    }
}
