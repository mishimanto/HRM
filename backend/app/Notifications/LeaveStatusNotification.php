<?php

namespace App\Notifications;

use App\Models\Leave;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $leave;

    public function __construct(Leave $leave)
    {
        $this->leave = $leave;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Leave Application ' . ucfirst($this->leave->status))
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Your leave application has been ' . $this->leave->status . '.')
            ->line('Leave Type: ' . ucfirst($this->leave->leave_type))
            ->line('Period: ' . $this->leave->start_date . ' to ' . $this->leave->end_date)
            ->line('Total Days: ' . $this->leave->total_days)
            ->line('Status: ' . ucfirst($this->leave->status))
            ->line('Admin Notes: ' . ($this->leave->admin_notes ?? 'N/A'))
            ->action('View Details', url('/leaves'))
            ->line('Thank you for using our HRM system!');
    }

    public function toArray($notifiable)
    {
        return [
            'leave_id' => $this->leave->id,
            'status' => $this->leave->status,
            'message' => 'Your leave application has been ' . $this->leave->status,
        ];
    }
}