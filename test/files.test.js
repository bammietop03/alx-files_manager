import chai from "chai";
import app from "../server";
import chaiHttp from "chai-http";
import { expect } from "chai";

chai.use(chaiHttp);


let token;
let fileId

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

describe('Testing files', () => {
    it('POST /files and return its content', (done) => {
        chai.request(app)
            .post('/files')
            .set('X-Token', token )
            .send({ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" })
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res.body).to.have.property('id').that.is.a('string');
                expect(res.body).to.have.property('userId').that.is.a('string');
                expect(res.body).to.have.property('name').that.is.a('string');
                fileId = res.body.id;
                done();
                
            });
    });

})

describe('Testing files with fileId', () => {
    it('GET /files with fileId and return its content', (done) => {
        chai.request(app)
            .get(`/files/${fileId}`)
            .set('X-Token', token )
            .end((err, res) => {
                expect(res).to.have.status(200);
                // expect(res.body).to.have.property('id').that.is.a('string');
                expect(res.body).to.have.property('userId').that.is.a('string');
                expect(res.body).to.have.property('name').that.is.a('string');
                done();
                
            });
    });

})