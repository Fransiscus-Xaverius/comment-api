const coba = (req, res) => {
  return res.status(200).send("Test");
};

//register endpoint
const register = async (req,res) =>{  
  let { nama, email, password, confirm_password} = req.body;

}

//login endpoint
const login = async (req,res) =>{
  let {nama, password} = req.body;
}

//Top up API Hit endpoint

//Cek Saldo endpoint

//Cek API Hit endpoint

module.exports = { coba };
