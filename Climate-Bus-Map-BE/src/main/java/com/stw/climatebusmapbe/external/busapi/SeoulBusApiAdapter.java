package com.stw.climatebusmapbe.external.busapi;

import com.stw.climatebusmapbe.common.exception.BusApiException;
import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import com.stw.climatebusmapbe.external.busapi.dto.NearbyStationDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class SeoulBusApiAdapter implements BusApiPort {

    private final RestClient restClient;
    private final String apiKey;
    private final String baseUrl;

    public SeoulBusApiAdapter(
            RestClient.Builder builder,
            @Value("${seoul.bus.api.key}") String apiKey,
            @Value("${seoul.bus.api.base-url}") String baseUrl
    ) {
        this.restClient = builder.build();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    @Override
    @Cacheable(value = "arrivals", key = "#stationId")
    public List<BusArrivalDto> getArrivals(String stationId) {
        log.info("도착 정보 조회: stationId={}", stationId);

        URI uri = UriComponentsBuilder.fromUriString(baseUrl + "/arrive/getLowArrInfoByStId")
                .queryParam("serviceKey", apiKey)
                .queryParam("stId", stationId)
                .build(true).toUri();
        log.info("요청 URL: {}", uri);

        String xml = restClient.get().uri(uri).retrieve().body(String.class);
        log.debug("도착정보 XML 응답: {}", xml);
        return parseArrivals(xml);
    }

    private List<BusArrivalDto> parseArrivals(String xml) {
        try {
            Document doc = parse(xml);

            String headerCd = getTagValue("headerCd", doc);
            if (!"0".equals(headerCd)) {
                String msg = getTagValue("headerMsg", doc);
                log.info("도착정보 API 비정상 응답 (headerCd={}): {}", headerCd, msg);
                return List.of(); // 결과 없음 등 비정상 응답 → 빈 목록 반환
            }

            NodeList items = doc.getElementsByTagName("itemList");
            List<BusArrivalDto> result = new ArrayList<>();
            for (int i = 0; i < items.getLength(); i++) {
                Element item = (Element) items.item(i);
                result.add(new BusArrivalDto(
                        getTagValue("busRouteId", item),
                        getTagValue("rtNm", item),
                        toInt(getTagValue("exps1", item)),
                        toInt(getTagValue("exps2", item))
                ));
            }
            return result;
        } catch (BusApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BusApiException("도착정보 XML 파싱 실패: " + e.getMessage());
        }
    }

    private Document parse(String xml) throws Exception {
        DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        return builder.parse(new InputSource(new StringReader(xml)));
    }

    private String getTagValue(String tag, Document doc) {
        NodeList nodes = doc.getElementsByTagName(tag);
        return nodes.getLength() > 0 ? nodes.item(0).getTextContent().trim() : "";
    }

    private String getTagValue(String tag, Element element) {
        NodeList nodes = element.getElementsByTagName(tag);
        return nodes.getLength() > 0 ? nodes.item(0).getTextContent().trim() : "";
    }

    @Override
    public List<NearbyStationDto> getNearbyStations(double lng, double lat, int radius) {
        log.info("정류소 위치 조회: lng={}, lat={}, radius={}", lng, lat, radius);

        URI uri = UriComponentsBuilder.fromUriString(baseUrl + "/stationinfo/getStationByPos")
                .queryParam("serviceKey", apiKey)
                .queryParam("tmX", lng)
                .queryParam("tmY", lat)
                .queryParam("radius", radius)
                .build(true).toUri();
        log.info("요청 URL: {}", uri);

        String xml = restClient.get().uri(uri).retrieve().body(String.class);
        log.debug("정류소 조회 응답: {}", xml);
        return parseNearbyStations(xml);
    }

    private List<NearbyStationDto> parseNearbyStations(String xml) {
        try {
            Document doc = parse(xml);

            String headerCd = getTagValue("headerCd", doc);
            if (!"0".equals(headerCd)) {
                throw new BusApiException(getTagValue("headerMsg", doc));
            }

            NodeList items = doc.getElementsByTagName("itemList");
            List<NearbyStationDto> result = new ArrayList<>();
            for (int i = 0; i < items.getLength(); i++) {
                Element item = (Element) items.item(i);
                result.add(new NearbyStationDto(
                        getTagValue("stationId", item),
                        getTagValue("stationNm", item),
                        getTagValue("arsId", item),
                        toDouble(getTagValue("gpsY", item)),   // 위도
                        toDouble(getTagValue("gpsX", item))    // 경도
                ));
            }
            return result;
        } catch (BusApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BusApiException("정류소 조회 XML 파싱 실패: " + e.getMessage());
        }
    }

    private int toInt(String value) {
        try { return Integer.parseInt(value); } catch (Exception e) { return 0; }
    }

    private double toDouble(String value) {
        try { return Double.parseDouble(value); } catch (Exception e) { return 0.0; }
    }
}
