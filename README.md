# Who Is Liar

## 프로젝트 진행 기간

**2025.04.14 ~ 2025.05.22 (6주)**

## 📌 목차

- [프로젝트 소개](#프로젝트-소개)
- [기능 소개](#기능-소개)
- [기술 스택](#기술-스택)
- [아키텍쳐](#아키텍쳐)
- [명세서](#명세서)
- [ERD](#ERD)
- [팀원](#팀원)

## ✏️프로젝트 소개
Who Is Liar는 실시간 얼굴·음성 분석으로 라이어를 찾아내는 데이터 기반 심리 추리 화상 게임입니다. 

## 🚀기능 소개
### 1. 로그인 
<p align="center">
    <img src="./readme/login.gif"/>
</p>

### 2. 룰북 
<p align="center">
    <img src="./readme/RuleBook.gif"/>
</p>

### 3. 방목록 조회 및 검색 
+ 비밀번호/코드 입장

### 4. 간편한 방 생성 및 초대 링크로 친구 초대
+ 다양한 모드 선택 지원 : 화면 모드(블라인드, 비디오), 게임 모드(일반, 바보)
+ 비번, 라운드수 설정 가능
<p align="center">
    <img src="./readme/RoomCreate.gif"/>
</p>

### 5. 대기방 - 채팅, 카테고리 선택
+ 비디오/오디오 체크 (파동효과)
+ 준비완료(준비상태 활성화) 버튼
<p align="center">
    <img src="./readme/Waiting-room.gif"/>
</p>

### 6. 자동 역할 배정과 개인별 제시어 전달
### 7. 채팅 진행 도움
+ 게임 진행 사회자 제공 (웹소켓)
+ 발언 턴 타이머

### 8. 실시간 표정·음성 분석(개인별 행동 로그)로 라이어 단서 제공
+ openvidu
+ 표정 : face-api 
+ 음성 : stt

### 9. 제한 시간 내 토론 후 직관적인 투표 UI 제공
<p align="center">
    <img src="./readme/LiarGuessResultModal.gif"/>
    <img src="./readme/VoteResultModal.gif"/>
    <img src="./readme/LiarFoundModal.gif"/>
    <img src="./readme/LiarNotFoundModal.gif"/>
</p>

### 10. 게임 결과에 따른 점수 집계 및 MVP 선정
<p align="center">
    <img src="./readme/SkipModal.gif"/>
    <img src="./readme/LiarWinModal.gif"/>
    <img src="./readme/CivilianWinModal.gif"/>
    <img src="./readme/FinalScoreModal.gif"/>
</p>

### 11. ai 활용 - stt 요약, 제시어 수집, 바보모드 유사 제시어 수집 


## ⚙️기술 스택

<table>
    <tr>
        <td><b>Back-end</b></td>
        <td><img src="https://img.shields.io/badge/Java-007396?style=flat-square&logo=Java&logoColor=white"/>
<img src="https://img.shields.io/badge/Spring Boot-6DB33F?style=flat-square&logo=Spring Boot&logoColor=white"/>
<img src="https://img.shields.io/badge/Spring Security-6DB33F?style=flat-square&logo=Spring Security&logoColor=white"/>
<img src="https://img.shields.io/badge/Gradle-C71A36?style=flat-square&logo=Gradle&logoColor=white"/>
<br>
<img src="https://img.shields.io/badge/MySql-4479A1?style=flat-square&logo=mysql&logoColor=white">
<img src="https://img.shields.io/badge/JPA-59666C?style=flat-square&logo=Hibernate&logoColor=white"/>
<img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=Redis&logoColor=white"/>
<br>

</td>
    </tr>
    <tr>
    <td><b>Front-end</b></td>
    <td>
<img src="https://img.shields.io/badge/Npm-CB3837?style=flat-square&logo=Npm&logoColor=white"/>
<img src="https://img.shields.io/badge/Node-339933?style=flat-square&logo=Node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=React&logoColor=white"/>
<img src="https://img.shields.io/badge/Zustand-000000?style=flat-square&logo=react&logoColor=white&labelColor=black" alt="Zustand Badge"/>
<img src="https://img.shields.io/badge/tailwindcss-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/>
<br>
<img src="https://img.shields.io/badge/JSON-000000?style=flat-square&logo=json&logoColor=white"/>
<img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white"/>
<img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white"/>
<img src="https://img.shields.io/badge/typescript-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
    </td>
    </tr>
    <tr>
    <td><b>Infra</b></td>
    <td>
<img src="https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonwebservices&logoColor=white"/>
<img src="https://img.shields.io/badge/Docker-4479A1?style=flat-square&logo=Docker&logoColor=white"/>
<img src="https://img.shields.io/badge/NGINX-009639?style=flat-square&logo=NGINX&logoColor=white"/>

</td>
    <tr>
    <td><b>Tools</b></td>
    <td>
    <img src="https://img.shields.io/badge/Notion-333333?style=flat-square&logo=Notion&logoColor=white"/>
    <img src="https://img.shields.io/badge/Figma-F24E1E?style=flat-square&logo=Figma&logoColor=white"/>
    <img src="https://img.shields.io/badge/GitLab-FCA121?style=flat-square&logo=GitLab&logoColor=white"/>
<img src="https://img.shields.io/badge/JIRA-0052CC?style=flat-square&logo=JIRA Software&logoColor=white"/>
<img src="https://img.shields.io/badge/Mattermost-0058CC?style=flat-square&logo=Mattermost&logoColor=white"/>
    </td>
    </tr>
</table>

## ⚙️아키텍쳐
![image](/readme/whoisliar_architecture.png)

## ⚙️명세서
- [기능명세서 (notion)](https://sudsy-scene-feb.notion.site/1d3e9e0919b981c3976afdcacee9a285?pvs=143)  
- [API 명세서 (notion)](https://sudsy-scene-feb.notion.site/API-1d3e9e0919b9810a85f8ec513e564b4e?pvs=143)

## ⚙️ERD
![image](/readme/whoisliar_erd.png)

## 👥팀원
**TEAM 낭만**
- 김상욱 : 팀장(PM), BE
- 김보민 : BE, WebSocket
- 김지환 : Infra, CI/CD
- 양영조 : FE, WebSocket
- 이예원 : FE, WebRTC
- 최은영 : FE, 퍼블리싱
