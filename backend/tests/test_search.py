from pathlib import Path
import sys
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import HTTPException, status

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.routers.search import search


class SearchRouteTest(unittest.IsolatedAsyncioTestCase):
    async def test_rejects_blank_query(self):
        with self.assertRaises(HTTPException) as ctx:
            await search(q="   ", user_id="user-1", token="token-1")

        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            ctx.exception.detail,
            {
                "code": "bad_request",
                "message": "Search query is required",
                "details": None,
            },
        )

    async def test_wraps_upstream_search_failure(self):
        request = httpx.Request("GET", "https://example.com/search")
        response = httpx.Response(503, request=request, text="upstream unavailable")
        upstream_error = httpx.HTTPStatusError("bad gateway", request=request, response=response)

        with patch("app.routers.search.get_user_cache_version", AsyncMock(return_value=1)), patch(
            "app.routers.search.get_cached_json", AsyncMock(return_value=None)
        ), patch("app.routers.search.select", AsyncMock(side_effect=upstream_error)), patch(
            "app.routers.search.set_cached_json", AsyncMock()
        ):
            with self.assertRaises(HTTPException) as ctx:
                await search(q="deadline", user_id="user-1", token="token-1")

        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ctx.exception.detail["code"], "bad_request")
        self.assertEqual(ctx.exception.detail["message"], "Search is temporarily unavailable")
        self.assertIn("Search backend returned 503", ctx.exception.detail["details"]["detail"])


if __name__ == "__main__":
    unittest.main()
