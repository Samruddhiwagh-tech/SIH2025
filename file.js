let attendanceData = [], marksData = [], feesData = [];

function parseCSV(content) {
  const rows = content.trim().split("\n");
  const headers = rows.shift().split(",");
  return rows.map(row => {
    const values = row.split(",");
    let obj = {};
    headers.forEach((h,i)=> obj[h.trim()] = values[i]?values[i].trim():"");
    return obj;
  });
}

function readFile(input, callback) {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => callback(parseCSV(e.target.result));
  reader.readAsText(file);
}

document.getElementById("attendanceFile").addEventListener("change", function(){ readFile(this,data=>attendanceData=data); });
document.getElementById("marksFile").addEventListener("change", function(){ readFile(this,data=>marksData=data); });
document.getElementById("feesFile").addEventListener("change", function(){ readFile(this,data=>feesData=data); });

document.getElementById("processBtn").addEventListener("click", ()=>{
  if(!attendanceData.length || !marksData.length || !feesData.length){
    alert("Upload all 3 CSV files!");
    return;
  }

  let merged = attendanceData.map(s=>{
    let id = s.StudentID;
    let marks = marksData.find(m=>m.StudentID===id) || {};
    let fee = feesData.find(f=>f.StudentID===id) || {};
    return {
      id,
      name: s.Name,
      attendance: parseFloat(s["Attendance%"]),
      marks: [marks.Test1,marks.Test2,marks.Test3].map(Number).filter(Boolean),
      feesPaid: fee.FeesPaid || "No"
    };
  });

  renderDashboard(merged);
});

function calculateRisk(student){
  let points=0;
  if(student.attendance<75) points++;
  if(student.marks.length>0){
    let avg = student.marks.reduce((a,b)=>a+b,0)/student.marks.length;
    if(avg<50) points++;
  }
  if(student.feesPaid.toLowerCase()!=="yes") points++;
  if(points===0) return {level:"Safe",class:"safe"};
  if(points===1) return {level:"At Risk",class:"warning"};
  return {level:"High Risk",class:"danger"};
}

function renderDashboard(students){
  let html = `<table>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Attendance</th>
      <th>Marks</th>
      <th>Fees</th>
      <th>Status</th>
    </tr>`;
  students.forEach(s=>{
    let risk = calculateRisk(s);
    html+=`<tr class="${risk.class}">
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.attendance}%</td>
      <td>${s.marks.join(",") || "-"}</td>
      <td>${s.feesPaid}</td>
      <td>${risk.level}</td>
    </tr>`;
  });
  html+="</table>";
  document.getElementById("dashboard").innerHTML=html;
}
