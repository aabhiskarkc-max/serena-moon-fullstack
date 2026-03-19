import { apiClient } from "./client"

export const login = async ({ email, password }: { email: string, password: string }) => {
    try {
        const res = await apiClient.post('/auth/login', {
            email,
            password
        })
        return res.data
    }
    catch (error) {
        throw error
    }


}

export const register=async({email,password,username}:{email:string,password:string,username:string})=>{
    try{
        const res=await apiClient.post('/auth/register',{
            email,
            password,
            username
        })
        return res.data

    }
    catch(error){
    throw error
    }
}