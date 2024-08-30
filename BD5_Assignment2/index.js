let express = require("express");
let { sequelize } = require("./lib/index");
let { Op } = require("@sequelize/core");
let { employee } = require("./models/employee.model");
let { department } = require("./models/department.model");
let { role } = require("./models/role.model");
let { employeeDepartment } = require("./models/employeeDepartment.model");
let { employeeRole } = require("./models/employeeRole.model");
let app = express();
let PORT = 3000;
app.listen(PORT, () => {
  console.log("This server is running.");
});
app.use(express.json());
// Seeding Database with initial data.
app.get("/seed_db", async (req, res) => {
  await sequelize.sync({ force: true });
  const departments = await department.bulkCreate([
    { name: 'Engineering' },
    { name: 'Marketing' },
  ]);
  const roles = await role.bulkCreate([
    { title: 'Software Engineer' },
    { title: 'Marketing Specialist' },
    { title: 'Product Manager' },
  ]);
  const employees = await employee.bulkCreate([
    { name: 'Rahul Sharma', email: 'rahul.sharma@example.com' },
    { name: 'Priya Singh', email: 'priya.singh@example.com' },
    { name: 'Ankit Verma', email: 'ankit.verma@example.com' },
  ]);
  await employeeDepartment.create({
    employeeId: employees[0].id,
    departmentId: departments[0].id,
  });
  await employeeRole.create({
    employeeId: employees[0].id,
    roleId: roles[0].id,
  });

  await employeeDepartment.create({
    employeeId: employees[1].id,
    departmentId: departments[1].id,
  });
  await employeeRole.create({
    employeeId: employees[1].id,
    roleId: roles[1].id,
  });

  await employeeDepartment.create({
    employeeId: employees[2].id,
    departmentId: departments[0].id,
  });
  await employeeRole.create({
    employeeId: employees[2].id,
    roleId: roles[2].id,
  });

  return res.json({ message: 'Database seeded!' });
});
// Defining helper functions.
async function getEmployeeDepartments(employeeId) {
  let employeeDepartments = await employeeDepartment.findAll({
    where: { employeeId },
    attributes: ["departmentId"]
  });
  let departmentIds = [];
  for (let i = 0; i < employeeDepartments.length; i++) {
    departmentIds.push(employeeDepartments[i].departmentId);
  }
  let departmentData = await department.findOne({
    where: { id: {[Op.in]: departmentIds } }
  });
  return departmentData;
}
async function getEmployeeRoles(employeeId) {
  let employeeRoles = await employeeRole.findAll({
    where: { employeeId },
    attributes: ["roleId"]
  });
  let roleIds = [];
  for (let i = 0; i < employeeRoles.length; i++) {
    roleIds.push(employeeRoles[i].roleId);
  }
  let roleData = await role.findOne({
    where: { id: { [Op.in]: roleIds } }
  });
  return roleData;
}
async function getEmployeeDetails(employeeData) {
  let department = await getEmployeeDepartments(employeeData.id);
  let role = await getEmployeeRoles(employeeData.id);
  return {
    employeeData,
    department,
    role
  }
}
// Exercise 1: Get All Employees
async function getAllEmployees() {
  let employeesDetails = await employee.findAll();
  let employees = [];
  for (let i = 0; i < employeesDetails.length; i++) {
    employees.push( await getEmployeeDetails(employeesDetails[i]));
  }
  return { employees };
}
app.get("/employees", async (req, res) => {
  try {
    let result = await getAllEmployees();
    if (result.employees.length === 0) {
      return res.status(404).json({ message: "No employees found."});
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Exercise 2: Get Employee by ID
async function getEmployeeById(id) {
  let employeeDetails = await employee.findOne({ where: { id } });
  if (! employeeDetails) {
    return null;
  }
  let employees = [];
  employees.push(await getEmployeeDetails(employeeDetails));
  return { employees };
}
app.get("/employees/details/:id", async (req, res) => {
  let id = req.params.id;
  try {
    let result = await getEmployeeById(id);
    if (result === null) {
      return res.status(404).json({ message: "No employee of id: " + id + " found"});
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Exercise 3: Get Employees by Department
async function getEmployeesByDepartment(departmentId) {
  let employeesDepartments = await employeeDepartment.findAll({
    where: { departmentId },
    attributes: ["employeeId"]
  });
  if (! employeesDepartments) {
    return null;
  }
  let employeesIds = [];
  for (let i = 0; i < employeesDepartments.length; i++) {
    employeesIds.push(employeesDepartments[i].employeeId);
  }
  let employeesDetails = await employee.findAll({
    where: { id: { [Op.in]: employeesIds } }
  });
  let employees = [];
  for (let i = 0; i < employeesDetails.length; i++) {
    employees.push(await getEmployeeDetails(employeesDetails[i]));
  }
  return { employees };
}
app.get("/employees/department/:departmentId", async (req, res) => {
  let departmentId = req.params.departmentId;
  try {
    let result = await getEmployeesByDepartment(departmentId);
    if (result === null) {
      return res.status(404).json({ message: "No employees found of departmentId: " + departmentId});
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Exercise 4: Get All Employees by Role
async function getEmployeesByRole(roleId) {
  let employeesRoles = await employeeRole.findAll({
    where: { roleId },
    attributes: ["employeeId"]
  });
  if (! employeesRoles) {
    return null
  }
  let employeesIds = [];
  for (let i = 0; i < employeesRoles.length; i++) {
    employeesIds.push(employeesRoles[i].employeeId);
  }
  let employeesDetails = await employee.findAll({
    where: { id: { [Op.in]: employeesIds } }
  });
  let employees = [];
  for (let i = 0; i < employeesDetails.length; i++) {
    employees.push(await getEmployeeDetails(employeesDetails[i]));
  }
  return { employees };
}
app.get("/employees/role/:roleId", async (req, res) => {
  let roleId = req.params.roleId;
  try {
    let result = await getEmployeesByRole(roleId);
    if ( result === null) {
      return res.status(404).json({ message: "No employee found"});
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Exercise 5: Get Employees Sorted by Name
async function sortEmployeesByName(order) {
  let employeesDetails = await employee.findAll({ order: [["name", order]] });
  let employees = [];
  for (let i = 0; i < employeesDetails.length; i++) {
    employees.push( await getEmployeeDetails(employeesDetails[i]));
  }
  return { employees };
}
app.get("/employees/sort-by-name", async (req, res) => {
  let order = req.query.order;
  try {
    let result = await sortEmployeesByName(order);
    if (result.employees.length === 0) {
      return res.status(404).json({ message: "No employees found."});
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Add new employee
async function addNewEmployee(newEmployeeData) {
  let newEmployeeDetails = await employee.create(newEmployeeData);
  await employeeDepartment.create({
    employeeId: newEmployeeDetails.id,
    departmentId: 1
  });
  await employeeRole.create({
    employeeId: newEmployeeDetails.id,
    roleId: 1
  });
  let employees = await getEmployeeDetails(newEmployeeDetails)
  return employees;
}
app.post("/employees/new", async (req, res) => {
  let newEmployeeData = req.body;
  try {
    let result = await addNewEmployee(newEmployeeData);
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Exercise 6: Update Employee Details
async function updateEmployeeDetails(id, data) {
  let employeeDetails = await employee.findOne({ where: { id } });
  if (! employeeDetails) {
    return null;
  }
  employeeDetails.set(data);
  let updateEmployee = await employeeDetails.save();
  let employees = await getEmployeeDetails(updateEmployee);
  return employees;
}
app.post("/employees/update/:id", async (req, res) => {
  let id = req.params.id;
  let data = req.body;
  try {
    let result = await updateEmployeeDetails(id, data);
    if ( result === null) {
      return res.status(404).json({ message: "No employee found with id: " + id});
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Exercise 7: Delete an Employee
async function deleteEmployeeById(id) {
  let deletedEmployee = await employee.findOne({ where: { id } });
  if (! deletedEmployee) {
    return null;
  }
  await deleteEmployeeDepartment(deletedEmployee.id);
  await deleteEmployeeRole(deletedEmployee.id);
  await employee.destroy({ where: { id } });
  return { message: " Employee with id: " + id + " deleted."};
}
async function deleteEmployeeDepartment(employeeId) {
  await employeeDepartment.destroy({ where: { employeeId } });
}
async function deleteEmployeeRole(employeeId) {
  await employeeRole.destroy({ where: { employeeId } });
}
app.post("/employees/delete", async (req, res) => {
  let id = req.body.id;
  try {
    let result = await deleteEmployeeById(id);
    if (result === null) {
      return res.status(404).json({ message: "No employee with id: " + id + " found."});
    }
    return res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});