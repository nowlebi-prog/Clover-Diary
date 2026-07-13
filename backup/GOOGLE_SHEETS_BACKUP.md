# Clover Desk Google Sheets Backup

이 백업은 Clover Desk 앱이 켜져 있을 때 Google Sheets로 데이터를 자동 저장하는 방식입니다.

## 1. Google Sheet 만들기

1. Google Drive에서 새 Google Sheets 파일을 만듭니다.
2. 파일 이름을 `Clover Desk Backup`처럼 알아보기 쉽게 바꿉니다.
3. 메뉴에서 `확장 프로그램 > Apps Script`를 엽니다.

## 2. Apps Script 붙여넣기

1. `backup/google-sheets-backup.gs` 내용을 Apps Script 편집기에 붙여넣습니다.
2. 저장합니다.
3. `배포 > 새 배포`를 누릅니다.
4. 유형은 `웹 앱`으로 선택합니다.
5. 실행 권한은 `나`, 액세스 권한은 `모든 사용자` 또는 `링크가 있는 모든 사용자`로 둡니다.
6. 배포 후 나오는 `/exec`로 끝나는 웹앱 URL을 복사합니다.

## 3. Clover Desk에 연결

1. Clover Desk 앱에서 `Settings`로 갑니다.
2. `Google Sheets 자동 백업` 카드에 웹앱 URL을 붙여넣습니다.
3. `URL 저장`을 누릅니다.
4. `자동 백업 켜기`를 누릅니다.
5. `지금 백업`을 한 번 눌러 Google Sheet에 탭이 생기는지 확인합니다.

## 동작 방식

- 앱이 켜져 있으면 주기적으로 최신 데이터를 Google Sheets에 보냅니다.
- `_raw_snapshot` 탭에는 복구용 전체 JSON이 들어갑니다.
- `_backup_log` 탭에는 백업 이력이 쌓입니다.
- `todos`, `events`, `expenses`, `moodEntries`, `workSessions` 같은 탭은 자동으로 생성되고 최신 데이터로 갱신됩니다.

## 주의

브라우저 앱이 완전히 꺼져 있으면 그 순간에는 백업이 실행되지 않습니다. 다시 앱을 열면 자동 백업이 재개됩니다.
