#pragma once

#include <variant>

#include "can/core/can_writer_task.hpp"
#include "can/core/ids.hpp"
#include "common/core/logging.h"
#include "motor-control/core/move_group.hpp"
#include "pipettes/core/tasks/messages.hpp"
#include "pipettes/core/tasks/motion_controller_task.hpp"

namespace pipettes {

namespace tasks {

namespace move_group_task {

constexpr std::size_t max_groups = 2;
constexpr std::size_t max_moves_per_group = 3;

using MoveGroupType =
    move_group::MoveGroupManager<max_groups, max_moves_per_group,
                                 can::messages::TipActionRequest>;

using TaskMessage =
    pipettes::task_messages::move_group_task_messages::MoveGroupTaskMessage;

/**
 * The handler of move group messages
 */
template <motion_controller_task::TaskClient MotionControllerClient,
          can::message_writer_task::TaskClient CanClient>
class MoveGroupMessageHandler {
  public:
    MoveGroupMessageHandler(MoveGroupType& move_group_manager,
                            MotionControllerClient& mc_client,
                            CanClient& can_client)
        : move_groups{move_group_manager},
          mc_client{mc_client},
          can_client{can_client} {}
    MoveGroupMessageHandler(const MoveGroupMessageHandler& c) = delete;
    MoveGroupMessageHandler(const MoveGroupMessageHandler&& c) = delete;
    auto operator=(const MoveGroupMessageHandler& c) = delete;
    auto operator=(const MoveGroupMessageHandler&& c) = delete;
    ~MoveGroupMessageHandler() = default;

    /**
     * Called upon arrival of new message
     * @param message
     */
    void handle_message(const TaskMessage& message) {
        std::visit([this](auto m) { this->handle(m); }, message);
    }

  private:
    void handle(std::monostate&) {}

    // TODO inherit from move group task for pipettes specifically
    void handle(const can::messages::TipActionRequest& m) {
        LOG("Received a tip action request: groupid=%d", m.group_id, m.seq_id);
        static_cast<void>(move_groups[m.group_id].set_move(m));
    }

    void handle(const can::messages::GetMoveGroupRequest& m) {
        LOG("Received get move group request: groupid=%d", m.group_id);
        auto group = move_groups[m.group_id];
        auto response = can::messages::GetMoveGroupResponse{
            .message_index = m.message_index,
            .group_id = m.group_id,
            .num_moves = static_cast<uint8_t>(group.size()),
            .total_duration = group.get_duration()};
        can_client.send_can_message(can::ids::NodeId::host, response);
    }

    void clear_move_groups() {
        for (auto& group : move_groups) {
            group.clear();
        }
    }

    void handle(const can::messages::ClearAllMoveGroupsRequest& m) {
        LOG("Received clear move groups request");
        this->clear_move_groups();
        can_client.send_can_message(can::ids::NodeId::host,
                                    can::messages::ack_from_request(m));
    }

    void handle(const can::messages::ExecuteMoveGroupRequest& m) {
        LOG("Received execute move group request: groupid=%d", m.group_id);
        auto group = move_groups[m.group_id];
        for (std::size_t i = 0; i < max_moves_per_group; i++) {
            auto move = group.get_move(i);
            std::visit([this](auto& m) { this->visit_move(m); }, move);
        }
        can_client.send_can_message(can::ids::NodeId::host,
                                    can::messages::ack_from_request(m));
    }

    void handle(const can::messages::StopRequest& m) {
        LOG("Received StopRequest in MoveGroup");
        this->clear_move_groups();
        // pass the stop message to motion controller to kill pwm
        // and any running moves
        mc_client.send_motion_controller_queue(m);
    }

    void visit_move(const std::monostate&) {}

    void visit_move(const can::messages::TipActionRequest& m) {
        mc_client.send_motion_controller_queue(m);
    }

    MoveGroupType& move_groups;
    MotionControllerClient& mc_client;
    CanClient& can_client;
};

/**
 * The task type.
 */
template <template <class> class QueueImpl>
    requires MessageQueue<QueueImpl<TaskMessage>, TaskMessage>
class MoveGroupTask {
  public:
    using Messages = TaskMessage;
    using QueueType = QueueImpl<TaskMessage>;
    MoveGroupTask(QueueType& queue) : queue{queue} {}
    MoveGroupTask(const MoveGroupTask& c) = delete;
    MoveGroupTask(const MoveGroupTask&& c) = delete;
    auto operator=(const MoveGroupTask& c) = delete;
    auto operator=(const MoveGroupTask&& c) = delete;
    ~MoveGroupTask() = default;

    /**
     * Task entry point.
     */
    template <motion_controller_task::TaskClient MotionControllerClient,
              can::message_writer_task::TaskClient CanClient>
    [[noreturn]] void operator()(MotionControllerClient* mc_client,
                                 CanClient* can_client) {
        auto handler =
            MoveGroupMessageHandler{move_group, *mc_client, *can_client};
        TaskMessage message{};
        for (;;) {
            if (queue.try_read(&message, queue.max_delay)) {
                handler.handle_message(message);
            }
        }
    }

    [[nodiscard]] auto get_queue() const -> QueueType& { return queue; }

  private:
    QueueType& queue;
    MoveGroupType move_group{};
};

/**
 * Concept describing a class that can message this task.
 * @tparam Client
 */
template <typename Client>
concept TaskClient = requires(Client client, const TaskMessage& m) {
    { client.send_move_group_queue(m) };
};

}  // namespace move_group_task
}  // namespace tasks
}  // namespace pipettes
