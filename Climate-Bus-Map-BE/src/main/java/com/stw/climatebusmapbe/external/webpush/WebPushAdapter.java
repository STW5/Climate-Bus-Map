package com.stw.climatebusmapbe.external.webpush;

import com.stw.climatebusmapbe.domain.alert.PushSubscription;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Security;

@Slf4j
@Component
public class WebPushAdapter {

    private final PushService pushService;

    public WebPushAdapter(
            @Value("${vapid.public-key}") String vapidPublicKey,
            @Value("${vapid.private-key}") String vapidPrivateKey,
            @Value("${vapid.subject}") String vapidSubject) throws Exception {
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        this.pushService = new PushService(vapidPublicKey, vapidPrivateKey)
                .setSubject(vapidSubject);
    }

    public void send(PushSubscription sub, String title, String body) {
        try {
            String payload = """
                    {"title":"%s","body":"%s","tag":"bus-alert"}"""
                    .formatted(title.replace("\"", "'"), body.replace("\"", "'"));

            Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuth(),
                    payload.getBytes(StandardCharsets.UTF_8)
            );
            pushService.send(notification);
        } catch (Exception e) {
            log.warn("Push 전송 실패 endpoint={}: {}", sub.getEndpoint(), e.getMessage());
        }
    }
}
