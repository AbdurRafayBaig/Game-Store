const sql = require("mssql/msnodesqlv8");
var config = {
    server : "DESKTOP-FN6N1S3\\SQLEXPRESS",
    database : "GAMESTOREDB",
    driver : "msnodesqlv8",
    user : "sa",
    password : "12345678",
    options : {
        trustedConnection:true
    }
} 

sql.connect(config,function(err){
    if(err)console.log(err);
    var request = new sql.Request();
    request.query("SELECT * FROM [User]", function(err, records) {
    if (err) console.log(err);
    else console.log(records);  
})  // Print all users
})
