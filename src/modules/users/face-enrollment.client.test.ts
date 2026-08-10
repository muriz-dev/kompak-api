import { afterEach, describe, expect, it, vi } from "vitest";
import type { KompakBindings } from "../../types";
import { httpFaceEnrollmentClient } from "./face-enrollment.client";

describe("Face Service client", () => {
    afterEach(() => vi.restoreAllMocks());

    it("submits the transient image to search and maps a match", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            Response.json({
                matched: true,
                face_id: "face-user-1",
                similarity: 0.91,
                threshold: 0.45,
            })
        );
        const image = new File([new Uint8Array([0xff, 0xd8])], "face.jpg", {
            type: "image/jpeg",
        });
        const env = {
            FACE_API_URL: "https://face.test/",
            FACE_API_KEY: "test-key",
        } as KompakBindings;

        const result = await httpFaceEnrollmentClient.search(env, image);

        expect(result).toEqual({
            matched: true,
            faceId: "face-user-1",
            similarity: 0.91,
            threshold: 0.45,
        });
        expect(fetchSpy).toHaveBeenCalledOnce();
        const [url, init] = fetchSpy.mock.calls[0];
        expect(url).toBe("https://face.test/api/v1/faces/search");
        expect(init?.headers).toEqual({ "X-API-Key": "test-key" });
        expect(init?.body).toBeInstanceOf(FormData);
        expect((init?.body as FormData).get("image")).toBeInstanceOf(File);
    });
});
