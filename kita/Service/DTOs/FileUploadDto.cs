using Microsoft.AspNetCore.Http;

namespace Kita.Service.DTOs
{
    public class FileUploadDto
    {
        public IFormFile File { get; set; }
    }
}
