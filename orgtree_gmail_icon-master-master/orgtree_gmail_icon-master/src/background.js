let popupWindowId = null;

// content script나 popup script으로부터의 메시지 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('백그라운드에서 메시지 수신:', message);

    if (message.action === "sendEmailData") {
        // Gmail "쓰기" 미니 팝업 창 찾기
        chrome.tabs.query({ url: "*://mail.google.com/*" }, (tabs) => {
            if (tabs.length === 0) {
                sendResponse({ success: false, error: "No Gmail tabs found" });
                return;
            }

            // Gmail 팝업 창에 데이터 삽입 요청
            const gmailTab = tabs[0]; // 첫 번째 Gmail 탭 선택
            chrome.scripting.executeScript(
                {
                    target: { tabId: gmailTab.id },
                    func: insertEmailData,
                    args: [message.data] // 전달할 데이터
                },
                (results) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error executing script:", chrome.runtime.lastError.message);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse({ success: true, result: results });
                    }
                }
            );
        });
        // 비동기 응답을 처리하기 위해 true 반환
        return true;
    }else if(message.action === "openOrgTree"){//조직도 팝업 호출
        handleOpenOrgTree();
        return true;
    }else{
        console.warn("Unknown action:", request.action);
        sendResponse({ success: false, error: "Unknown action" }); // 기본 응답
    }
    return true;
});//chrome.runtime.onMessage.addListener

// Gmail DOM에 데이터를 삽입하는 함수
function insertEmailData({ flagValue, userList =[], teamUserList =[]}) {
    try {
        // teamUserList가 존재하면 기존 값 유지하면서 userList 추가
        if (teamUserList.length > 0) {
            const mergedList = [...new Set([...teamUserList, ...userList])]; // 중복 제거 후 병합
            userList = mergedList;
        }
        console.log("최종 userList:", userList);

        // 자동완성 팝업 제거 함수
        function removeAutoCompletePopup() {
            const element = document.querySelector('.afC.mS5Pff');
            if (element) {
                element.remove();
            }
        }

        // 각각의 필드가 DOM에 준비될 때까지 대기하는 함수
        function waitForField(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();

                (function checkField() {
                    const Field = document.querySelector(selector);
                    if (Field) {
                        resolve(Field); // 필드가 준비되면 반환
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error("Field not found within timeout"));
                    } else {
                        setTimeout(checkField, 100); // 100ms 간격으로 재확인
                    }
                })();
            });
        }

        // 공통 필드 처리 함수
        async function handleFieldInput(button, inputSelector, flagValue) {
            removeAutoCompletePopup(); // 자동완성 팝업 제거
            if(flagValue === 'CC'|| flagValue === 'BCC') {
                button.click(); // 드롭다운 열기(참조, 숨은 참조)
            }
            try {
                // 필드가 준비될 때까지 대기
                const Field = await waitForField(inputSelector);

                // 기존 값 유지하면서 추가하기 위해 쉼표로 구분된 문자열로 변환
                const existingValue = Field.value ? Field.value.split(",").map(s => s.trim()) : [];
                const finalList = [...new Set([...existingValue, ...userList])].join(", "); // 기존값 + 새 값 병합 후 중복 제거

                // 값 설정
                Field.value = finalList;
                // 값 변경 이벤트 트리거
                Field.dispatchEvent(new Event("input", { bubbles: true }));
                Field.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

                // 값 설정 후 자동완성 팝업 제거
                removeAutoCompletePopup();

                console.log(`${flagValue} data inserted:`, finalList);
            } catch (error) {
                console.error(`${flagValue} field not found!`, error);
            }
        }

        // 수신자 필드 처리
        if (flagValue == 'to') {
            handleFieldInput('',
                "input[aria-label='수신자']",
                "TO"
            );
        }
        // 참조인 필드 처리
        else if (flagValue === 'cc') {
            handleFieldInput(
                document.querySelector("span[aria-label='참조 수신자 추가 ‪(Ctrl-Shift-C)‬']"),
                "input[aria-label='참조 수신자']",
                "CC"
            );
        }
        // 숨은 참조 필드 처리
        else if (flagValue === 'bcc') {
            handleFieldInput(
                document.querySelector("span[aria-label='숨은참조 수신자 추가 ‪(Ctrl-Shift-B)‬']"),
                "input[aria-label='숨은참조 수신자']",
                "BCC"
            );
        }
    } catch (error) {
        console.error("Error inserting recipient data:", error);
    }
}

//조직도 팝업을 여는 함수
function handleOpenOrgTree() {
    if (popupWindowId !== null) {
        chrome.windows.remove(popupWindowId, () => {
            console.log("이전 팝업 창 닫음");
        });
    }
-
    // 새로운 팝업 창 생성
    chrome.windows.create({
        url: "http://localhost:8090", // IntelliJ에서 실행 중인 JSP의 URL
        type: 'popup', // 팝업 창으로 열기
        width: 900, // 원하는 팝업 창 너비
        height: 950, // 원하는 팝업 창 높이
        focused: true
    }, (window) => {
        if (chrome.runtime.lastError) {
            console.error('팝업 창 생성 실패:', chrome.runtime.lastError.message);
            return;
        }
        console.log('JSP 팝업이 열렸습니다. Window ID:', window.id);
    });
}


