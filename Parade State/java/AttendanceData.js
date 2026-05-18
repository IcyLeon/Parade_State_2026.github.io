const SPREADSHEET_ID = '1vylevO7L00uoj69y0ScnPj6W2CorNUCZRtflnUsOMZo';


class Staff
{
  constructor(StaffName)
  {
    this.StaffName = StaffName;
  }
}

class Office
{
  Staffs = new Map();

  constructor(OfficeName, OfficeID)
  {
    this.OfficeName = OfficeName;
    this.OfficeID = OfficeID;
  }

  GetStaff(StaffName) {
    for (let staff of this.Staffs.keys()) {
      if (staff.StaffName === StaffName) 
        return staff;
    }
    return undefined;
  }

  AddStaff(StaffName)
  {
    if (this.GetStaff(StaffName) != undefined)
      return;

    var staff = new Staff(StaffName);
    this.Staffs.set(staff, "no resp");
  }
  
  UpdateAttendance(StaffName, Attendance)
  {
    var staff = this.GetStaff(StaffName);
    this.Staffs.set(staff, Attendance);
  }

  CountPresent()
  {
    let count = 0;
    for (let attendanceDetails of this.Staffs.values()) {
      const upper = attendanceDetails.toUpperCase();
      if (upper.includes("PRESENT") || upper.includes("NSC")) {
        count++;
      }
    }
    return count;
  }
  
  GetPrintText() {
    let output = `--${this.OfficeName}: (${this.CountPresent()}/${this.Staffs.size})--\n`;
    for (let [staffObj, attendanceDetails] of this.Staffs) {
      output += `${staffObj.StaffName}: ${attendanceDetails}\n`;
    }
    return output;
  }
}

class OfficeManager
{
  AllStaffs = new Map();
  OfficeList = new Map();

  constructor()
  {
  
  }

  AddOffice(OfficeID, OfficeName)
  {
    this.OfficeList.set(OfficeID, new Office(OfficeName, OfficeID));
  }

  AddStaff(OfficeID, StaffName)
  {
    var office = this.OfficeList.get(OfficeID);

    if (office == undefined)
      return;

    office.AddStaff(StaffName);
    this.AllStaffs.set(StaffName, OfficeID);
  }

  UpdateAttendance(StaffName, Attendance)
  {
    var officeID = this.AllStaffs.get(StaffName);
    var office = this.OfficeList.get(officeID);

    if (office == undefined)
      return;

    office.UpdateAttendance(StaffName, Attendance);
  }

  GetPrintText() {
    let fullReport = "";
    for (let office of this.OfficeList.values()) {
      fullReport += office.GetPrintText() + "\n";
    }
    return fullReport;
  }
}

var officeManager = new OfficeManager();

function read_Office() {
  var params = {
    spreadsheetId: SPREADSHEET_ID,
    range: 'HonourRoll!F2:G',
  };

  return gapi.client.sheets.spreadsheets.values.get(params)
    .then(function(response) {
      var rows = response.result.values;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0])
          officeManager.AddOffice(rows[i][0], rows[i][1]);
      }
    }, function(reason) {
      console.error('error: ' + reason.result.error.message);
    });
}

function read_Staffs() {
  var params = {
    spreadsheetId: SPREADSHEET_ID,
    range: 'HonourRoll!A2:B',
  };

  return gapi.client.sheets.spreadsheets.values.get(params)
    .then(function(response) {
    var rows = response.result.values;
    for (let i = 0; i < rows.length; i++)
    {
      if (rows[i][0])
        officeManager.AddStaff(rows[i][1], rows[i][0])
    }

  }, function(reason) {
    console.error('error: ' + reason.result.error.message);
  });
}

function read_Attendance() {
  var params = {
    spreadsheetId: SPREADSHEET_ID,
    range: 'AttendanceRoll!B2:C',
  };

  return gapi.client.sheets.spreadsheets.values.get(params)
    .then(function(response) {
    var rows = response.result.values;
    for (let i = 0; i < rows.length; i++)
    {
      if (rows[i][0])
        officeManager.UpdateAttendance(rows[i][0], rows[i][1])
    }

  }, function(reason) {
    console.error('error: ' + reason.result.error.message);
  });
}


async function ShowData() {
  try {
    // FIXED: Run sequentially because Staff relies on Offices, and Attendance relies on Staff.
    console.log("Loading Offices...");
    await read_Office();
    
    console.log("Loading Staff...");
    await read_Staffs();
    
    console.log("Loading Attendance...");
    await read_Attendance();
    
    console.log("All data loaded successfully!");
    
    let finalOutput = "-- SMTI TLSB/COMD Office Parade State Summary --\n\n" + officeManager.GetPrintText();
    document.getElementById("report").innerText = finalOutput;

  } catch (error) {
    console.error("Execution failed: ", error);
    document.getElementById("report").innerText = "Failed to load data.";
  }
}
