import unittest
import uuid

from fastapi.testclient import TestClient

from main import app


class JobDistributorAPITests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.username = f"testuser_{uuid.uuid4().hex[:8]}"
        self.email = f"{self.username}@example.com"
        self.password = "StrongPass123!"

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_register_login_and_project_flow(self):
        register_response = self.client.post(
            "/auth/register",
            json={"email": self.email, "username": self.username, "password": self.password},
        )
        self.assertEqual(register_response.status_code, 201)

        login_response = self.client.post(
            "/auth/login",
            data={"username": self.username, "password": self.password},
        )
        self.assertEqual(login_response.status_code, 200)
        token = login_response.json()["access_token"]
        self.assertTrue(token)

        headers = {"Authorization": f"Bearer {token}"}
        project_response = self.client.post(
            "/projects",
            json={"name": "Demo Project", "description": "Created by automated test"},
            headers=headers,
        )
        self.assertEqual(project_response.status_code, 201)

        project_id = project_response.json()["id"]
        list_response = self.client.get("/projects", headers=headers)
        self.assertEqual(list_response.status_code, 200)
        self.assertTrue(any(item["id"] == project_id for item in list_response.json()))

        detail_response = self.client.get(f"/projects/{project_id}", headers=headers)
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["name"], "Demo Project")


if __name__ == "__main__":
    unittest.main()
