const { response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];


//midleware
function virifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).json({
            error: "Customer not found!"
        })
    }

    req.customer = customer;

    return next();
}


function getBalance(statment) {
    const balance = statment.reduce((acc, operation) => {
        if (operation.type == 'credit') {
            return acc + operation.amount;
        } else if (operation.type == 'debit') {
            return acc - operation.amount;
        }
    }, 0);

    return balance; 
}

app.post('/account', (req, res) => {
    const {cpf, name} = req.body;

    const customersAlreadyExists = customers.some((costumer) => costumer.cpf === cpf);

    if (customersAlreadyExists) {
        res.status(400).json({
            error: "Customer already exists!"
        });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statment: []
    });

    return res.status(201).send();
});


app.get("/statment", virifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    return res.json(customer.statment);
});


app.post("/deposit", virifyIfExistsAccountCPF, (req, res) => {
    const { description, amount } = req.body;
    const { customer } = req;

    const statmentOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statment.push(statmentOperation);

    return res.status(201).send();
});


app.post("/withdraw", virifyIfExistsAccountCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statment);

    if (balance < amount) {
        return res.status(400).json({
            error: "Insuficients founds!"
        });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statment.push(statementOperation);

    return res.status(201).send();
});

app.get("/statment/date", virifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statment.filter((statment) => statment.created_at.toDateString() === new Date(dateFormat).toDateString());

    return res.json(statement);
});


app.put("/account", virifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name = name;

    return res.status(201).send();
});

app.get("/account", virifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer);
});

app.delete("/account", virifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    customers.splice(customer, 1);

    return res.status(200).json({
        customers
    });
});

app.get("/balance", virifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    
    const balance = getBalance(customer.statment);

    return res.json(balance);
});

app.listen(3333);