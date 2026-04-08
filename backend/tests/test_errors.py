from pathlib import Path
import sys
import unittest

sys.path.append(str(Path(__file__).resolve().parents[1]))

from fastapi import HTTPException, status

from app.errors import bad_request, forbidden, not_found


class ErrorHelpersTest(unittest.TestCase):
    def test_bad_request_raises_structured_http_exception(self):
        with self.assertRaises(HTTPException) as ctx:
            bad_request("Invalid payload", {"field": "subject"})

        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            ctx.exception.detail,
            {
                "code": "bad_request",
                "message": "Invalid payload",
                "details": {"field": "subject"},
            },
        )

    def test_not_found_raises_structured_http_exception(self):
        with self.assertRaises(HTTPException) as ctx:
            not_found("Email not found")

        self.assertEqual(ctx.exception.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            ctx.exception.detail,
            {"code": "not_found", "message": "Email not found"},
        )

    def test_forbidden_raises_structured_http_exception(self):
        with self.assertRaises(HTTPException) as ctx:
            forbidden("Access denied")

        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            ctx.exception.detail,
            {"code": "forbidden", "message": "Access denied"},
        )


if __name__ == "__main__":
    unittest.main()
