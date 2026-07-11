<?php

namespace App\Events;

use App\Models\Leave;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LeaveStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $leave;

    public function __construct(Leave $leave)
    {
        $this->leave = $leave->load('employee.user');
    }

    public function broadcastOn()
    {
        return new PrivateChannel('user.' . $this->leave->employee->user_id);
    }

    public function broadcastWith()
    {
        return [
            'leave_id' => $this->leave->id,
            'status' => $this->leave->status,
            'message' => 'Your leave application has been ' . $this->leave->status,
            'employee_name' => $this->leave->employee->user->name,
        ];
    }
}