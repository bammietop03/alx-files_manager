import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';

chai.use(chaiHttp);

let token;

describe('testing user authentication', () => {
  it('gET /connect', () => new Promise((done) => {
    chai.request(app)
      .get('/connect')
      .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token').that.is.a('string');
        token = res.body.token;
        done();
      });
  }));
});

describe('testing /users/me route', () => {
  it('gET /users/me should return user details', () => new Promise((done) => {
    chai.request(app)
      .get('/users/me')
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('id').that.is.a('string');
        expect(res.body).to.have.property('email').that.is.a('string');
        done();
      });
  }));
});

describe('testing user authentication', () => {
  it('gET /disconnect', () => new Promise((done) => {
    chai.request(app)
      .get('/disconnect')
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(204);
        done();
      });
  }));
});

describe('testing GET /users/me route', () => {
  it('should return error because X_Token has been revoked', () => new Promise((done) => {
    chai.request(app)
      .get('/users/me')
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').that.equal('Unauthorized');
        done();
      });
  }));
});
