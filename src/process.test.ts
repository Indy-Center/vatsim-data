import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { config } from "./config";
import logger from "./logger";
import { ingestAndProcess } from "./process";
import { BrokerAsPromised } from "rascal";
import type { VatsimData } from "./types";

// Test constants
const TEST_FIXTURES = {
  validData: {
    general: {
      version: 1,
      reload: 1,
      update: "2024-03-07T23:15:00Z",
      update_timestamp: "2024-03-07T23:15:00.000Z",
      connected_clients: 100,
      unique_users: 90,
    },
    pilots: [
      {
        cid: 1234567,
        name: "Test Pilot",
        callsign: "TEST1",
        server: "TEST_SERVER",
        pilot_rating: 1,
        military_rating: 0,
        lattitude: 51.5074,
        longitude: -0.1278,
        altitude: 35000,
        groundspeed: 450,
        transponder: "2200",
        qnh_i_hg: 29.92,
        qnh_mb: 1013,
        flight_plan: null,
        logon_time: "2024-03-07T22:00:00Z",
        last_updated: "2024-03-07T23:15:00Z",
      },
    ],
    controllers: [
      {
        cid: 7654321,
        name: "Test Controller",
        callsign: "TEST_CTR",
        frequency: 123.45,
        facility: 1,
        rating: 3,
        server: "TEST_SERVER",
        visual_range: 150,
        text_atis: ["Test ATIS"],
        last_updated: "2024-03-07T23:15:00Z",
        logon_time: "2024-03-07T22:00:00Z",
      },
    ],
    atis: [],
    prefiles: [],
    servers: [],
    facilities: [],
    ratings: [],
    pilot_ratings: [],
    military_ratings: [],
  } satisfies VatsimData,
  emptyData: {
    general: {
      version: 1,
      reload: 1,
      update: "2024-03-07T23:15:00Z",
      update_timestamp: "2024-03-07T23:15:00.000Z",
      connected_clients: 0,
      unique_users: 0,
    },
    pilots: [],
    controllers: [],
    atis: [],
    prefiles: [],
    servers: [],
    facilities: [],
    ratings: [],
    pilot_ratings: [],
    military_ratings: [],
  } satisfies VatsimData,
};

// Mock external dependencies
vi.mock("axios");
vi.mock("./logger", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    silly: vi.fn(),
  },
}));
vi.mock("rascal");

describe("VATSIM Data Processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ingestAndProcess", () => {
    it("should fetch and publish VATSIM data successfully", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: TEST_FIXTURES.validData,
      });

      const mockBroker = {
        publish: vi.fn().mockResolvedValue(undefined),
      } as unknown as BrokerAsPromised;

      await ingestAndProcess(mockBroker);

      // Verify API call
      expect(axios.get).toHaveBeenCalledWith(config.VATSIM_DATA_URL);

      // Verify raw feed publication
      expect(mockBroker.publish).toHaveBeenCalledWith(
        "raw.feed",
        expect.objectContaining({
          data: TEST_FIXTURES.validData,
        }),
        expect.any(Object)
      );

      // Verify individual type publications
      expect(mockBroker.publish).toHaveBeenCalledWith(
        "raw.feed",
        expect.objectContaining({
          data: TEST_FIXTURES.validData.pilots[0],
        }),
        expect.objectContaining({
          routingKey: "raw.pilots",
        })
      );

      // Verify total number of publications
      expect(mockBroker.publish).toHaveBeenCalledTimes(3);

      // Verify logging with specific counts
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(
          "pilots: 1, controllers: 1, atis: 0, prefiles: 0"
        )
      );
    });

    it("should handle empty data sets correctly", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: TEST_FIXTURES.emptyData,
      });

      const mockBroker = {
        publish: vi.fn().mockResolvedValue(undefined),
      } as unknown as BrokerAsPromised;

      await ingestAndProcess(mockBroker);

      // Should only publish raw feed, no individual items
      expect(mockBroker.publish).toHaveBeenCalledTimes(1);
      expect(mockBroker.publish).toHaveBeenCalledWith(
        "raw.feed",
        expect.objectContaining({
          data: TEST_FIXTURES.emptyData,
        }),
        expect.any(Object)
      );

      // Verify logging with zero counts
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(
          "pilots: 0, controllers: 0, atis: 0, prefiles: 0"
        )
      );
    });

    it("should handle API fetch failure gracefully", async () => {
      const testError = new Error("API Error");
      vi.mocked(axios.get).mockRejectedValueOnce(testError);

      const mockBroker = {
        publish: vi.fn(),
      } as unknown as BrokerAsPromised;

      await ingestAndProcess(mockBroker);

      // Verify specific error logging
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error ingesting VATSIM Data: ${testError}`)
      );

      // Verify no publications were made
      expect(mockBroker.publish).not.toHaveBeenCalled();
    });

    it("should handle broker publish failure gracefully", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: TEST_FIXTURES.validData,
      });

      const testError = new Error("Broker Error");
      const mockBroker = {
        publish: vi.fn().mockRejectedValue(testError),
      } as unknown as BrokerAsPromised;

      await ingestAndProcess(mockBroker);

      // Verify specific error logging
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error publishing to RabbitMQ: ${testError}`)
      );
    });
  });
});
