const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const route = path.join(__dirname, "covid19India.db");
let db = null;

const getDatabase = async () => {
  try {
    db = await open({
      filename: route,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      "Server running at http://localhost:3000/";
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

getDatabase();
//Get Details

const getStateDetails = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

app.get("/states/", async (request, response) => {
  const databaseCondition = `
    SELECT * 
    FROM state;`;

  const getDetails = await db.all(databaseCondition);
  response.send(getDetails.map((eachstate) => getStateDetails(eachstate)));
});

//get a particular state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const sqlQuery = `
    SELECT * 
    FROM state 
    WHERE state_id=${stateId};`;

  const get_details = await db.get(sqlQuery);

  response.send(getStateDetails(get_details));
});

//create a district table

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const sqlDetails = `
    INSERT INTO 
    district (district_name, state_id, cases, cured, active, deaths)
    VALUES
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}

    );`;
  const insertDetails = await db.run(sqlDetails);
  response.send("District Successfully Added");
});

//GET A DISTRICT
const districtDetails = (districts) => {
  return {
    districtId: districts.district_id,
    districtName: districts.district_name,
    stateId: districts.state_id,
    cases: districts.cases,
    cured: districts.cured,
    active: districts.active,
    deaths: districts.deaths,
  };
};

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const sql_details = `
    SELECT * 
    FROM district 
    WHERE 
    district_id=${districtId};
    `;

  const get_district = await db.get(sql_details);
  response.send(districtDetails(get_district));
});

//delete
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const sqlData = `
        DELETE FROM 
        district 
        WHERE 
        district_id=${districtId};`;

  const deleteDistrict = await db.run(sqlData);
  response.send("District Removed");
});

//Put details

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const sql_data = `
    UPDATE 
    district 
    SET 
    district_name='${districtName}',
    state_id= ${stateId},
    cases= ${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths} 
    
    WHERE 
    district_id=${districtId};`;

  const updateDetails = await db.run(sql_data);
  response.send("District Details Updated");
});

//get statistics

const requiredFunction = (requiredDetails) => {
  let totalcases = 0;
  let totalcured = 0;
  let totalactive = 0;
  let totaldeaths = 0;
  for (eachset of requiredDetails) {
    totalcases += eachset.cases;
    totalcured += eachset.cured;
    totalactive += eachset.active;
    totaldeaths += eachset.deaths;
  }
  return {
    totalCases: totalcases,
    totalCured: totalcured,
    totalActive: totalactive,
    totalDeaths: totaldeaths,
  };
};
app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;

  const sqlData = `
    SELECT * 
    FROM district 
    WHERE state_id=${stateId};
    `;
  const get_details = await db.all(sqlData);
  const get_set = requiredFunction(get_details);
  response.send(get_set);
});

//get state name based on district

const getdetail = (statenames) => {
  return {
    stateName: statenames.state_name,
  };
};
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const sqlquery = `
    SELECT state_name
    FROM state NATURAL JOIN district  
    ;`;

  const queryresult = await db.get(sqlquery);
  response.send(getdetail(queryresult));
});

module.exports = app;
