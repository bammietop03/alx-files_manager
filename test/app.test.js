import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';

chai.use(chaiHttp);

describe('testing AppController routes', () => {
  it('gET /status', async () => {
    chai.request(app)
      .get('/status')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('db').that.equal(true);
        expect(res.body).to.have.property('redis').that.equal(true);
      });
  });

  it('gET /stats', async () => {
    chai.request(app)
      .get('/stats')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('users').that.is.a('number');
        expect(res.body).to.have.property('files').that.is.a('number');
      });
  });
});
