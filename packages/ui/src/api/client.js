import axios from 'axios'
import { baseURL, ErrorMessage } from '@/store/constant'
import AuthUtils from '@/utils/authUtils'

const apiClient = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
        'Content-type': 'application/json',
        'x-request-from': 'internal'
    },
    withCredentials: true,
    timeout: 10000 // 10 second timeout
})

// Request interceptor to handle base URL issues
apiClient.interceptors.request.use(
    function (config) {
        // Ensure baseURL is set
        if (!config.baseURL) {
            config.baseURL = `${baseURL}/api/v1`
        }
        return config
    },
    function (error) {
        return Promise.reject(error)
    }
)

apiClient.interceptors.response.use(
    function (response) {
        return response
    },
    async (error) => {
        // Handle network errors or missing response
        if (!error.response) {
            console.error('Network error or server not available:', error.message)
            return Promise.reject({
                response: {
                    status: 0,
                    data: { message: 'Network error or server not available' }
                }
            })
        }

        if (error.response.status === 401) {
            // check if refresh is needed
            if (error.response.data.message === ErrorMessage.TOKEN_EXPIRED && error.response.data.retry === true) {
                const originalRequest = error.config
                // call api to get new token
                const response = await axios.post(`${baseURL}/api/v1/auth/refreshToken`, {}, { withCredentials: true })
                if (response.data.id) {
                    // retry the original request
                    return apiClient.request(originalRequest)
                }
            }
            localStorage.removeItem('username')
            localStorage.removeItem('password')
            AuthUtils.removeCurrentUser()
        }

        return Promise.reject(error)
    }
)

export default apiClient
