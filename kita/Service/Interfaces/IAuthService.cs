using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Auth;

namespace Kita.Service.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto registerDto);
        Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto loginDto);
    }
}
