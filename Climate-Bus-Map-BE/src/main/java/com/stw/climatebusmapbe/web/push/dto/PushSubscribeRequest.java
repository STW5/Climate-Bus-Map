package com.stw.climatebusmapbe.web.push.dto;

public record PushSubscribeRequest(String endpoint, String p256dh, String auth) {}
