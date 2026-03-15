# 🔒 보안 가이드

## API 키 관리

이 프로젝트는 OpenAI API를 사용하여 AI 챗봇 기능을 제공합니다.

### ⚠️ 중요 보안 사항

1. **API 키를 절대 코드에 직접 입력하지 마세요**
   - API 키는 설정 페이지에서 사용자가 직접 입력하도록 되어 있습니다.
   - API 키는 브라우저의 LocalStorage에만 저장됩니다.

2. **GitHub에 업로드하지 말아야 할 파일**
   - `.env` 파일
   - `config.js` 또는 `apikeys.js` 같은 설정 파일
   - 개인 API 키가 포함된 모든 파일

3. **`.gitignore` 파일 확인**
   - 이미 `.gitignore` 파일이 생성되어 있습니다.
   - 민감한 정보가 포함된 파일이 자동으로 제외됩니다.

## API 키 발급 방법

1. [OpenAI Platform](https://platform.openai.com/api-keys)에 접속
2. 계정 생성 또는 로그인
3. API Keys 메뉴에서 새 키 생성
4. 생성된 키를 복사하여 설정 페이지에 입력

## 사용자 가이드

### API 키 설정 방법

1. 대시보드에서 **설정** 메뉴로 이동
2. **AI 챗봇 설정** 섹션 찾기
3. OpenAI API 키 입력란에 발급받은 키 입력
4. 자동으로 저장됨 (브라우저 LocalStorage)

### 주의사항

- API 키는 **절대 다른 사람과 공유하지 마세요**
- API 키가 노출되면 즉시 OpenAI 플랫폼에서 삭제하고 새로 발급받으세요
- API 사용량에 따라 요금이 부과될 수 있습니다

## 개발자를 위한 보안 체크리스트

- [ ] `.gitignore` 파일이 프로젝트에 포함되어 있는지 확인
- [ ] API 키가 코드에 하드코딩되어 있지 않은지 확인
- [ ] `git status`로 민감한 파일이 커밋 대상에 포함되지 않았는지 확인
- [ ] GitHub에 푸시하기 전에 모든 민감한 정보 제거 확인

## 문제 발생 시

API 키가 실수로 GitHub에 업로드된 경우:

1. **즉시 OpenAI 플랫폼에서 해당 키 삭제**
2. 새로운 API 키 발급
3. Git 히스토리에서 민감한 정보 제거:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch <파일명>" \
   --prune-empty --tag-name-filter cat -- --all
   ```
4. 강제 푸시: `git push origin --force --all`

## 참고 자료

- [OpenAI API 문서](https://platform.openai.com/docs)
- [GitHub 보안 가이드](https://docs.github.com/en/code-security)
