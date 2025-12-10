namespace Kita.Service.DTOs.Request
{
    public class UpdatePasswordRequestDto
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
    }
}