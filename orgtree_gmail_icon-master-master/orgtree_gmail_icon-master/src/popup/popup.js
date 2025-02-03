document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:8090/rest/admin/api/sync/employees')
        .then(response => response.json())
        .then(data => {
            console.log('API 응답 데이터:', data); // 데이터 구조 확인
            const tableBody = document.getElementById('employeeList');
            data.forEach(emp => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${emp.empNm}</td>
                    <td>${emp.empNo}</td>
                    <td>${emp.email}</td>
                    <td>${emp.jobTelNo}</td>
                    <td>${emp.mobileTelNo}</td>
                `;
                row.addEventListener('click', () => {
                    console.log(`선택한 이메일: ${emp.email}`); // 선택한 이메일 확인용
                    chrome.runtime.sendMessage({ action: 'insertEmailToPopup', email: emp.email });
                    chrome.runtime.sendMessage({ action: 'closePopup' }); // 팝업 창 닫기 요청
                });
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('데이터 로드 실패', error));
});
