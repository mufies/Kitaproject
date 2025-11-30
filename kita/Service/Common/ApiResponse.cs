using System.Collections.Generic;

namespace Kita.Service.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public int Code { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public ApiResponse() 
        {
            Code = 200;
        }

        public ApiResponse(T data, string message = "")
        {
            Success = true;
            Code = 200;
            Message = message;
            Data = data;
        }

        public ApiResponse(string message)
        {
            Success = true;
            Code = 200;
            Message = message;
        }

        public static ApiResponse<T> Fail(string message, List<string>? errors = null, int code = 400)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Code = code,
                Message = message,
                Errors = errors
            };
        }
    }
}
