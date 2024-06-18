import chai from "chai";
import app from "../server";
import chaiHttp from "chai-http";
import { expect } from "chai";

chai.use(chaiHttp);


describe('Testing the POST /Users Routes', () => {
    it('POST /users', (done) => {
        chai.request(app)
            .post('/users')
            .send({ "email": "banwyyy@gmail.com", "password": "banwyyy12" })
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res.body).to.have.property('email').that.equal('banwyyy@gmail.com');
                expect(res.body).to.have.property('id').that.is.a('string');
                done();
            })
    })

    it('POST /users with thesame params', (done) => {
        chai.request(app)
            .post('/users')
            .send({ "email": "banwyyy@gmail.com", "password": "banwyyy12" })
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body).to.have.property('error').that.equal('Already exist');
                done();
            })
    })

    it('POST /users without password', (done) => {
        chai.request(app)
            .post('/users')
            .send({ "email": "banwyyy1@gmail.com"})
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body).to.have.property('error').that.equal('Missing password');
                done();
            })
    })
})