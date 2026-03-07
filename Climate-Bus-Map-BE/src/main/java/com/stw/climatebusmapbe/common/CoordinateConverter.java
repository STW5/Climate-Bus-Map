package com.stw.climatebusmapbe.common;

import org.locationtech.proj4j.BasicCoordinateTransform;
import org.locationtech.proj4j.CRSFactory;
import org.locationtech.proj4j.CoordinateReferenceSystem;
import org.locationtech.proj4j.CoordinateTransform;
import org.locationtech.proj4j.ProjCoordinate;
import org.springframework.stereotype.Component;

@Component
public class CoordinateConverter {

    private final CoordinateTransform wgs84ToTm;

    public CoordinateConverter() {
        CRSFactory crsFactory = new CRSFactory();
        CoordinateReferenceSystem wgs84 = crsFactory.createFromName("EPSG:4326");
        CoordinateReferenceSystem koreanTm = crsFactory.createFromName("EPSG:5181");
        this.wgs84ToTm = new BasicCoordinateTransform(wgs84, koreanTm);
    }

    // WGS84(lat, lng) → TM(tmX, tmY) 반환
    public double[] toTM(double lat, double lng) {
        ProjCoordinate src = new ProjCoordinate(lng, lat); // proj4j는 (x=경도, y=위도)
        ProjCoordinate dst = new ProjCoordinate();
        wgs84ToTm.transform(src, dst);
        return new double[]{dst.x, dst.y};
    }
}
