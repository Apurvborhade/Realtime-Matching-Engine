export function errorHandler(err:any,req:any,res:any,next:any){
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
 
    res.status(status).json({message});
}