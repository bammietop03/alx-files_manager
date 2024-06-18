import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';

chai.use(chaiHttp);

describe('testing the POST /Users Routes', () => {
  it('pOST /users', () => new Promise((done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'banwyyy@gmail.com', password: 'banwyyy12' })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('email').that.equal('banwyyy@gmail.com');
        expect(res.body).to.have.property('id').that.is.a('string');
        done();
      });
  }));

  it('pOST /users with thesame params', () => new Promise((done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'banwyyy@gmail.com', password: 'banwyyy12' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error').that.equal('Already exist');
        done();
      });
  }));

  it('pOST /users without password', () => new Promise((done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'banwyyy1@gmail.com' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error').that.equal('Missing password');
        done();
      });
  }));
});
