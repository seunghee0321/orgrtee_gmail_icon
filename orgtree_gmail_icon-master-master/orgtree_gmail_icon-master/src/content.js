// 메일 작성 폼 하단의 툴바 감지 및 아이콘 추가
function addButtonToToolbar() {
    const observer = new MutationObserver((mutations, obs) => {
        const toolbar = document.querySelector('.bAK'); // 하단 툴바 영역을 찾음, DOM 변화 시 수정
        if (toolbar) {
            addOrgTreeButton(toolbar);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// 조직도 아이콘을 하단 툴바에 추가
function addOrgTreeButton(toolbar) {

    //이미 버튼이 추가되어 있는 경우 중복 추가 방지
    if (document.querySelector('.orgTree-button')) return;

    //버튼 생성 & 속성 설정
    // 마우스를 올릴 때 표시될 문구 등, 기존 지메일의 버튼 스타일에 맞게 설정
    const button = document.createElement('div');
    button.className = 'orgTree-button btA J-J5-Ji T-I';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', '조직도 열기');
    button.setAttribute('aria-label', '조직도 열기');

    //버튼을 지메일의 UI와 일치 시킴
    button.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 0 4px;
        margin: 0;
        height: 100%;
        vertical-align: middle;
        user-select: none;
        cursor: pointer;
    `;

    //버튼에 조직도 아이콘을 표시, icon_ex.svg 파일 사용
    button.innerHTML = `
        <div class="asa" style="display: flex; align-items: center; justify-content: center;">
            <img src="${chrome.runtime.getURL('icons/icon_ex.svg')}"
                 style="width: auto; height: 21px; margin: 0; object-fit: contain;"
                 alt="조직도">
        </div>
    `;

    //클릭 시 조직도 팝업 열기 요청
    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openOrgTree' });
    });

    //마우스 오버 시 버튼 스타일 변경
    button.addEventListener('mouseover', () => button.classList.add('J-J5-Ji'));
    button.addEventListener('mouseout', () => button.classList.remove('J-J5-Ji'));

    //버튼을 툴바에 추가
    toolbar.appendChild(button);
}
// JSP로부터 메시지를 받는 부분
window.addEventListener("sendDataToExtension", (event) => {
    const { action, data } = event.detail;
    // background.js로 메시지 전달
    chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message to background:", chrome.runtime.lastError.message);
        } else {
            console.log("Response from background.js:", response);
        }
    });
});

//툴바 버튼 추가 함수 호출
addButtonToToolbar();