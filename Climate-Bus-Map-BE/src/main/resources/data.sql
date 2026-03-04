-- 기후동행카드 사용 가능 노선 초기 데이터 (샘플)
-- 실제 전체 노선: 서울시 기후동행카드 공식 홈페이지 참조 후 추가
INSERT INTO climate_eligible_routes (route_id, route_no, route_type, updated_at) VALUES
('100100118', '402',  '간선', NOW()),
('100100234', '721',  '지선', NOW()),
('100100056', '201',  '간선', NOW()),
('100100112', '271',  '간선', NOW()),
('100100089', '370',  '지선', NOW())
ON CONFLICT (route_id) DO NOTHING;
