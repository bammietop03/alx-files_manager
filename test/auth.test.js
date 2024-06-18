import chai from "chai";
import app from "../server";
import chaiHttp from "chai-http";
import { expect } from "chai";

chai.use(chaiHttp);

let token;

describe('Testing user authentication', () => {
    it('GET /connect', (done) => {
        chai.request(app)
            .get('/connect')
            .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('token').that.is.a('string');
                token = res.body.token;
                done();
            });
    });
});

describe('Testing /users/me route', () => {
    it('GET /users/me should return user details', (done) => {
        chai.request(app)
            .get('/users/me')
            .set('X-Token', token )
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('id').that.is.a('string');
                expect(res.body).to.have.property('email').that.is.a('string');
                done();
            });
    });
});

describe('Testing user authentication', () => {
    it('GET /disconnect', (done) => {
        chai.request(app)
            .get('/disconnect')
            .set('X-Token', token )
            .end((err, res) => {
                expect(res).to.have.status(204);
                done();
            });
    });
});

describe('Testing GET /users/me route', () => {
    it('should return error because X_Token has been revoked', (done) => {
        chai.request(app)
            .get('/users/me')
            .set('X-Token', token )
            .end((err, res) => {
                expect(res).to.have.status(401);
                expect(res.body).to.have.property('error').that.equal('Unauthorized');
                done();
            });
    });
});