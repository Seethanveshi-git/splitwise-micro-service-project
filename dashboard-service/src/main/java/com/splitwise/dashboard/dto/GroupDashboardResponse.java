package com.splitwise.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDashboardResponse {
    private Object group;
    private List<Object> members;
    private List<Object> expenses;
    private List<Object> balances;
}
