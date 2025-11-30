using Kita.Service.Common;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaseApiController : ControllerBase
    {
        protected ActionResult HandleResult<T>(ApiResponse<T> result)
        {
            if (result.Code == 0)
            {
                return result.Success ? Ok(result) : BadRequest(result);
            }
            return StatusCode(result.Code, result);
        }
    }
}
