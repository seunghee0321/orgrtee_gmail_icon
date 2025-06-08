let popupWindowId = null;

// content.js 로부터 메시지 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendEmailData" || message.action === "sendEmailDataUndo") {
        // Gmail 팝업 창 찾기
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
                (results) => sendResponse?.({ success: !chrome.runtime.lastError })
            );
        });
        return true;
    }else if(message.action === "openOrgTree"){//조직도 팝업 호출
        handleOpenOrgTree();
        return true;
    }
    return true;
});//chrome.runtime.onMessage.addListener

// Gmail DOM에 데이터 삽입
async function insertEmailData(data) {
    try {
        if (data.flagValue === 'undo') { //되돌리기
            await undoFieldInput();
            return;
        }

        // data의 각 flag(to, cc, bcc)에 대해 이메일 리스트 처리
        Object.keys(data).forEach(flag => {
            const userList = data[flag];  // flag에 해당하는 이메일 리스트

            // 이메일 리스트를 각각의 flag에 맞는 userList로 병합
            let emailList = userList.map(user => user.email);  // 이메일 주소만 추출

            // 각 flag에 맞는 필드를 처리
            switch (flag) {
                case 'to':
                    handleFieldInput(null, "input[aria-label='수신자']", emailList, "TO");
                    break;
                case 'cc':
                    handleFieldInput(
                        document.querySelector("span[aria-label='참조 수신자 추가 ‪(Ctrl-Shift-C)‬']"),
                        "input[aria-label='참조 수신자']",
                        emailList,
                        "CC",
                    );
                    break;
                case 'bcc':
                    handleFieldInput(
                        document.querySelector("span[aria-label='숨은참조 수신자 추가 ‪(Ctrl-Shift-B)‬']"),
                        "input[aria-label='숨은참조 수신자']",
                        emailList,
                        "BCC",
                    );
                    break;
            }//switch
        });

        // 각각의 필드가 DOM에 준비될 때까지 대기
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
        // Gmail 작성 폼 필드값 삭제(되돌리기)
        async function undoFieldInput() {
            const selectors = [
                "input[aria-label='수신자']",
                "input[aria-label='참조 수신자']",
                "input[aria-label='숨은참조 수신자']"
            ];

            for (const selector of selectors) {
                try {
                    const field = await waitForField(selector);
                    if (field) {
                        field.value = "";
                    }
                } catch (error) {
                    console.warn(`Field not found for selector: ${selector}`, error);
                }
            }
        }
        //수신, 참조, 숨은 참조 필드에 이메일 삽입 처리
        async function handleFieldInput(button, inputSelector, emailList, flagValue) {
            // flagValue가 'CC' 또는 'BCC'이고 emailList가 비어있지 않으면 참조, 수신참조 필드 열기
            if ((flagValue === 'CC' || flagValue === 'BCC') && emailList.length > 0 && button) {
                button.click();
            }
            try {
                const field = await waitForField(inputSelector);
                let currentValues = field.value ? field.value.split(",").map(s => s.trim()) : [];

                // emailList에서 이메일만 추출하여 추가 (중복 제거)
                currentValues = [...new Set([...currentValues, ...emailList])];

                // 필드에 값 설정
                field.value = currentValues.join(", ");
            } catch (error) {
                console.error(`${flagValue} field error:`, error);
            }
        }//handleFieldInput
    }catch (error) {
        console.error("Error inserting recipient data:", error);
    }
}//insertEmailData

//조직도 프로그램 열기
function handleOpenOrgTree() {
    //중복으로 열리는 것을 방지
    if (popupWindowId !== null) {
        chrome.windows.remove(popupWindowId, () => {
        });
    }

    chrome.windows.create({
        url: "http://localhost:8090",
        type: 'popup',
        width: 970,
        height: 800,
        focused: true
    }, (window) => {
        if (chrome.runtime.lastError) {
            console.error('팝업 창 생성 실패:', chrome.runtime.lastError.message);
            return;
        }
    });
}//handleOpenOrgTree


