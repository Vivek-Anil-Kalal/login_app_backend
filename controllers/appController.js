import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ENV from '../config.js'
import otpGenerator from 'otp-generator'

/** middleware for verify user */
export async function verifyUser(req, res, next) {
    try {

        const { username } = req.method == "GET" ? req.query : req.body;

        // check the user existance
        let exist = await UserModel.findOne({ username });
        if (!exist) return res.status(404).send({ error: "Can't find User!" });
        next();

    } catch (error) {
        return res.status(404).send({ error: "Authentication Error" });
    }
}

export async function test(){
    console.log("Helo");
}

/** POST: http://localhost:8080/api/register
 * @param : {
  "username" : "example123",
  "password" : "admin123",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william",
  "mobile": 8009860560,
  "address" : "Apt. 556, Kulas Light, Gwenborough",
  "profile": ""
}
*/
export async function register(req, res) {
    try {
        const { username, password, profile, email } = req.body;

        // check the existing user
        const existUsername = new Promise((resolve, reject) => {
            UserModel.findOne({ username })
                .then((foundUser) => {
                    if (foundUser) reject({ error: "Please use unique username" })

                    resolve();
                }).catch(error => {
                    return res.status(500).send({ error: "This is Username Error " + error })
                })
        });

        // check for existing email
        const existEmail = new Promise((resolve, reject) => {

            UserModel.findOne({ email })
                .then((foundUser) => {
                    if (foundUser) reject({ error: "Please use unique Email" })

                    resolve();
                }).catch(error => {
                    return res.status(500).send({ error: "This is Email Error " + error })
                })
        })

        Promise.all([existUsername, existEmail]).then(() => {
            if (password) {
                bcrypt.hash(password, 10)
                    .then(hashedPassword => {

                        const user = new UserModel({
                            username,
                            password: hashedPassword,
                            profile: profile || '',
                            email
                        });

                        // return save result as a response
                        user.save()
                            .then(result => res.status(201).send({ msg: "You've Successfully Registered..." }))
                            .catch(error => res.status(500).send({ error }))

                    }).catch(error => {
                        return res.status(500).send({
                            error: "Enable to hashed password"
                        })
                    })
            }
        }).catch(error => {
            return res.status(500).send({ error: `Here is Error ${error}` })
        })


    } catch (error) {
        return res.status(500).send({ error: "Why " + error });

    }
}

/** POST: http://localhost:8080/api/login 
 * @param: {
  "username" : "example123",
  "password" : "admin123"
}
*/
export async function login(req, res) {
    const { username, password } = req.body;

    try {

        UserModel.findOne({ username })
            .then(user => {
                bcrypt.compare(password, user.password)
                    .then(passwordCheck => {

                        // this means empty password
                        if (!passwordCheck) return res.status(400).send({ error: "Don't have Password...!" })

                        // create jwt token (Json Web Token) for Authentication
                        const token = jwt.sign({
                            userId: user._id,
                            username: user.username,
                        }, ENV.JWT_SECRET, { expiresIn: "24h" })


                        return res.status(200).send({
                            msg: "Login Successfull...!",
                            username: user.username,
                            token
                        })

                    })
                    .catch(error => {
                        return res.status(400).send({ error: "Password Not Matched...!" })
                    })
            })
            .catch(error => {
                return res.status(404).send({ error: "User Not Found...!" })
            })
    } catch (error) {
        return res.status(500).send({ error: "This Is Login Error" })
    }

}

/** GET: http://localhost:8080/api/user/example123 */
export async function getUser(req, res) {
    const { username } = req.params; // params is for url value
    try {

        if (!username) return res.status(501).send({ error: "Invalid User" });

        UserModel.findOne({ username })
            .then((user) => {

                if (!user) return res.status(501).send({ error: "Couldn't Find the User" });

                /** To filter the password from the user details :- left side of eqauls*/
                // mongoose return unnecessary data with object so convert it into json :- right side of eqauls
                const { password, ...rest } = Object.assign({}, user.toJSON());

                return res.status(201).send(rest);
            })
            .catch(error => {
                return res.status(500).send({ error });
            })
    } catch (error) {
        return res.status(404).send({ error: "Cannot find the User" })
    }

}

/** PUT: http://localhost:8080/api/updateuser 
 * @param: {
  "header" : "<token>"
}
body: {
    firstName: '',
    address : '',
    profile : ''
}
*/
export async function updateUser(req, res) {
    try {

        const { userId } = req.user;

        if (userId) {
            const body = req.body;

            // update the data
            UserModel.updateOne({ _id: userId }, body)
                .then((data) => {

                    return res.status(201).send({ msg: "Record Updated...!" });
                })
                .catch(error => {
                    return res.status(401).send({ error: "This causes Error" });
                })

        } else {
            return res.status(401).send({ error: "User Not Found...!" });
        }

    } catch (error) {
        return res.status(401).send({ error });
    }
}

/** GET: http://localhost:8080/api/generateOTP */
export async function generateOTP(req, res) {

    // specify the length of otp first then cases
    req.app.locals.OTP = await otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false })
    console.log(req.app.locals.OTP);
    res.status(201).send({ code: req.app.locals.OTP })
}

/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req, res) {
    const { code } = req.query;
    if (parseInt(code) === parseInt(req.app.locals.OTP)) {
        req.app.locals.OTP = null; // reset otp
        req.app.locals.resetSession = true; // start session for reset password

        return res.status(201).send({ msg: "Verified Successfully...!" })
    }
    return res.status(400).send({ error: "Invalid OTP...!" })
}

// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req, res) {
    if (req.app.locals.resetSession) {
        return res.status(201).send({ flag : req.app.locals.resetSession })
    }
    return res.status(440).send({ error: "Session Expired!" })
}

// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPassword */
export async function resetPassword(req, res) {

    try {
        if (!req.app.locals.resetSession) return res.status(440).send({ error: "Session Expired!" })

        const { username, password } = req.body;
        try {

            UserModel.findOne({ username })
                .then(user => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            // first find the user using username and then 2nd parameter to update password
                            UserModel.updateOne({ username: user.username }, { password: hashedPassword })
                                .then(data => {
                                    return res.status(201).send({ msg: "Record updated Successfully...!" })
                                })
                                .catch(err => {
                                    return res.status(401).send({ error: "Cannot Update Data...!" })
                                })
                        })
                        .catch(error => {
                            return res.status(500).send({ error: "Enable to Hash Password...!" });
                        })
                })
                .catch(error => {
                    return res.status(404).send({ error: "User Not Found...!" })
                })

        } catch (error) {
            return res.status(500).send({ error })
        }

    } catch (error) {
        return res.status(401).send({ error })
    }
}

